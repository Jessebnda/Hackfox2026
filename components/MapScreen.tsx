import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';

import { ACCESSIBLE_POINTS, AccessiblePoint } from '@/constants/accessiblePoints';
import { DEFAULT_REGION } from '@/constants/map';
import ManualReportModal from '@/components/ManualReportModal';
import ReroutePromptModal from '@/components/ReroutePromptModal';
import ScreenShell from '@/components/screen-shell';
import VozToggle from '@/components/voizToggle';
import { describeRouteObstaclePhoto } from '@/services/imageDescription';
import { fetchWalkingRoute, LatLng, RouteCoordinate } from '@/services/openRouteService';
import { PlaceResult, searchPlaces } from '@/services/placesSearch';
import { RouteReportCategory, saveRouteReport } from '@/services/routeReports';
import { parseMapCenter } from '@/utils/coordinates';
import { useNavegacion } from '@/hooks/useNavegacion'; 

type MapScreenProps = {
	bottomInset?: number;
};

type ExpandedPanel = 'map' | 'search';

type ActiveRouteTarget = LatLng & { label: string };

function inferReportCategory(description: string): RouteReportCategory {
	const text = description.toLowerCase();
	if (text.includes('bloquead') || text.includes('cerrad') || text.includes('cerrado')) {
		return 'ruta_bloqueada';
	}

	if (text.includes('obra') || text.includes('construcción') || text.includes('construccion')) {
		return 'obra';
	}

	if (
		text.includes('rampa') ||
		text.includes('escalera') ||
		text.includes('banqueta') ||
		text.includes('accesib')
	) {
		return 'accesibilidad';
	}

	return 'obstaculo_vial';
}

function formatRouteSummary(distanceMeters: number, durationSeconds: number) {
	const km = distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${Math.round(distanceMeters)} m`;
	const minutes = Math.max(1, Math.round(durationSeconds / 60));
	return `${km} · ~${minutes} min a pie`;
}

export default function MapScreen({ bottomInset = 0 }: MapScreenProps) {
	const [region, setRegion] = useState<Region>(() => ({
		...DEFAULT_REGION,
		...parseMapCenter(process.env.EXPO_PUBLIC_MAP_CENTER),
	}));
	const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>('map');
	const [selectedPointId, setSelectedPointId] = useState(ACCESSIBLE_POINTS[0].id);
	const [locationStatus, setLocationStatus] = useState<'loading' | 'ready' | 'blocked'>('loading');
	const [userLocation, setUserLocation] = useState<LatLng | null>(null);
	const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
	const [routeSummary, setRouteSummary] = useState<string | null>(null);
	const [routeError, setRouteError] = useState<string | null>(null);
	const [isRouting, setIsRouting] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [destination, setDestination] = useState<PlaceResult | null>(null);
	const [activeRouteTarget, setActiveRouteTarget] = useState<ActiveRouteTarget | null>(null);
	const [showRerouteModal, setShowRerouteModal] = useState(false);
	const [isRerouteBusy, setIsRerouteBusy] = useState(false);
	const [rerouteBusyMessage, setRerouteBusyMessage] = useState('Procesando…');
	const [reportNotice, setReportNotice] = useState<string | null>(null);
	const [showManualReportModal, setShowManualReportModal] = useState(false);
	const [visionErrorHint, setVisionErrorHint] = useState<string | null>(null);
	const [prefillDescription, setPrefillDescription] = useState<string | null>(null);
	const mapRef = useRef<MapView>(null);
	const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const { estaNavegando,iniciarNavegacion,cancelarNavegacion,} = useNavegacion();

	const selectedPoint = useMemo(
		() => ACCESSIBLE_POINTS.find((point) => point.id === selectedPointId) ?? ACCESSIBLE_POINTS[0],
		[selectedPointId],
	);

	const hasActiveRoute = routeCoordinates.length > 1 && activeRouteTarget != null;

	useEffect(() => {
		let isMounted = true;

		const requestLocation = async () => {
			const permission = await Location.requestForegroundPermissionsAsync();

			if (!isMounted || permission.status !== 'granted') {
				setLocationStatus('blocked');
				return;
			}

			const currentLocation = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});

			if (!isMounted) {
				return;
			}

			const coords = {
				latitude: currentLocation.coords.latitude,
				longitude: currentLocation.coords.longitude,
			};

			setUserLocation(coords);
			setLocationStatus('ready');
			setRegion({
				...coords,
				latitudeDelta: 0.08,
				longitudeDelta: 0.08,
			});
		};

		void requestLocation();

		return () => {
			isMounted = false;
		};
	}, []);


	useEffect(() => {
		if (searchDebounceRef.current) {
			clearTimeout(searchDebounceRef.current);
		}

		const trimmed = searchQuery.trim();
		if (!trimmed) {
			setSearchResults([]);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);
		searchDebounceRef.current = setTimeout(() => {
			void searchPlaces(trimmed, userLocation)
				.then((results) => setSearchResults(results))
				.finally(() => setIsSearching(false));
		}, 350);

		return () => {
			if (searchDebounceRef.current) {
				clearTimeout(searchDebounceRef.current);
			}
		};
	}, [searchQuery, userLocation]);

	const centerOnUser = async () => {
		const permission = await Location.getForegroundPermissionsAsync();
		if (permission.status !== 'granted') {
			setLocationStatus('blocked');
			return;
		}

		const currentLocation = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.Balanced,
		});

		const coords = {
			latitude: currentLocation.coords.latitude,
			longitude: currentLocation.coords.longitude,
		};

		setUserLocation(coords);
		const nextRegion = {
			...coords,
			latitudeDelta: 0.08,
			longitudeDelta: 0.08,
		};

		setRegion(nextRegion);
		mapRef.current?.animateToRegion(nextRegion, 700);
	};

	useEffect(() => {
		if (expandedPanel !== 'search' || userLocation || locationStatus === 'blocked') {
			return;
		}

		void centerOnUser();
	}, [expandedPanel, userLocation, locationStatus]);

	const focusCoordinate = (latitude: number, longitude: number, delta = 0.04) => {
		const nextRegion = {
			latitude,
			longitude,
			latitudeDelta: delta,
			longitudeDelta: delta,
		};

		setRegion(nextRegion);
		mapRef.current?.animateToRegion(nextRegion, 700);
	};

	const focusPoint = (point: AccessiblePoint) => {
		setSelectedPointId(point.id);
		focusCoordinate(point.latitude, point.longitude);
	};

	const calculateRouteTo = async (target: LatLng, label: string) => {
		setRouteError(null);
		setRouteSummary(null);
		setRouteCoordinates([]);

		if (estaNavegando) {
			await cancelarNavegacion();
		}

		let origin = userLocation;
		if (!origin) {
			const permission = await Location.getForegroundPermissionsAsync();
			if (permission.status !== 'granted') {
				setRouteError('Activa la ubicación para calcular una ruta desde tu posición.');
				return;
			}

			const currentLocation = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});
			origin = {
				latitude: currentLocation.coords.latitude,
				longitude: currentLocation.coords.longitude,
			};
			setUserLocation(origin);
		}

		setIsRouting(true);
		try {
			const route = await fetchWalkingRoute(origin, target);
			setRouteCoordinates(route.coordinates);
			setActiveRouteTarget({
				latitude: target.latitude,
				longitude: target.longitude,
				label,
			});
			setRouteSummary(`${label} · ${formatRouteSummary(route.distanceMeters, route.durationSeconds)}`);
			setReportNotice(null);
			setExpandedPanel('map');

			if (route.coordinates.length > 1) {
				mapRef.current?.fitToCoordinates(route.coordinates, {
					edgePadding: { top: 80, right: 50, bottom: 140, left: 50 },
					animated: true,
				});
			}

			await iniciarNavegacion(origin, target);

		} catch (error) {
			const message = error instanceof Error ? error.message : 'No se pudo calcular la ruta.';
			setRouteError(message);
		} finally {
			setIsRouting(false);
		}
	};

	const handleSelectPlace = (place: PlaceResult) => {
		setDestination(place);
		setSearchQuery(place.name);
		focusCoordinate(place.latitude, place.longitude);
		void calculateRouteTo(
			{ latitude: place.latitude, longitude: place.longitude },
			place.name,
		);
	};

	const resolveUserLocation = async (): Promise<LatLng | null> => {
		if (userLocation) {
			return userLocation;
		}

		const permission = await Location.getForegroundPermissionsAsync();
		if (permission.status !== 'granted') {
			return null;
		}

		const currentLocation = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.Balanced,
		});

		const coords = {
			latitude: currentLocation.coords.latitude,
			longitude: currentLocation.coords.longitude,
		};
		setUserLocation(coords);
		return coords;
	};

	const performReroute = async () => {
		if (!activeRouteTarget) {
			return;
		}

		await centerOnUser();
		await calculateRouteTo(
			{ latitude: activeRouteTarget.latitude, longitude: activeRouteTarget.longitude },
			activeRouteTarget.label,
		);
	};

	const handleReroutePress = () => {
		if (!hasActiveRoute) {
			return;
		}

		setShowRerouteModal(true);
	};

	const closeRerouteModal = () => {
		if (isRerouteBusy) {
			return;
		}

		setShowRerouteModal(false);
	};

	const handleRerouteWithoutReport = async () => {
		setShowRerouteModal(false);
		setReportNotice('Recalculando ruta…');
		await performReroute();
	};

	const saveReportAndReroute = async (description: string) => {
		setRerouteBusyMessage('Guardando reporte…');
		const coords = (await resolveUserLocation()) ?? {
			latitude: region.latitude,
			longitude: region.longitude,
		};

		const saved = await saveRouteReport({
			category: inferReportCategory(description),
			description,
			latitude: coords.latitude,
			longitude: coords.longitude,
			routeDestinationLabel: activeRouteTarget?.label,
		});

		setReportNotice(`Reporte guardado (${saved.category}). Recalculando ruta…`);
		setShowRerouteModal(false);
		setShowManualReportModal(false);
		setVisionErrorHint(null);
		setPrefillDescription(null);
		await performReroute();
	};

	const handleRerouteWithPhotoReport = async () => {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) {
			setRouteError('Se necesita permiso de cámara para reportar la razón del reruteo.');
			setShowRerouteModal(false);
			return;
		}

		const capture = await ImagePicker.launchCameraAsync({
			mediaTypes: ['images'],
			quality: 0.55,
			base64: true,
		});

		const asset = capture.assets?.[0];
		if (capture.canceled || !asset?.uri) {
			return;
		}

		if (!asset.base64) {
			setVisionErrorHint('No se pudo obtener la foto en base64. Intenta de nuevo o escribe el reporte.');
			setShowRerouteModal(false);
			setShowManualReportModal(true);
			return;
		}

		setIsRerouteBusy(true);
		setRerouteBusyMessage('Analizando foto (base64)…');

		try {
			const description = await describeRouteObstaclePhoto({
				uri: asset.uri,
				mimeType: asset.mimeType ?? 'image/jpeg',
				base64: asset.base64,
			});

			setPrefillDescription(description);
			setShowRerouteModal(false);
			setShowManualReportModal(true);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'No se pudo analizar la foto.';
			setVisionErrorHint(message);
			setPrefillDescription(null);
			setShowRerouteModal(false);
			setShowManualReportModal(true);
		} finally {
			setIsRerouteBusy(false);
			setRerouteBusyMessage('Procesando…');
		}
	};

	const handleManualReportSubmit = async (description: string) => {
		setIsRerouteBusy(true);
		setRerouteBusyMessage('Guardando reporte…');

		try {
			await saveReportAndReroute(description);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'No se pudo guardar el reporte.';
			setRouteError(message);
		} finally {
			setIsRerouteBusy(false);
			setRerouteBusyMessage('Procesando…');
		}
	};

	const activeLabel = destination?.name ?? selectedPoint.name;

	return (
		<View style={styles.container}>
			<StatusBar style="dark" />
			<ScreenShell>
				<View style={[styles.header, styles.headerCompact]}>
					{/* NUEVO: Toggle de voz en el header */}
					<VozToggle />
				</View>

				<View style={styles.expandedTabs}>
						<Pressable
							style={[styles.expandedTab, expandedPanel === 'map' && styles.expandedTabActive]}
							onPress={() => setExpandedPanel('map')}
						>
							<MaterialCommunityIcons
								name="map-outline"
								size={16}
								color={expandedPanel === 'map' ? '#e80000' : '#666'}
							/>
							<Text style={[styles.expandedTabText, expandedPanel === 'map' && styles.expandedTabTextActive]}>
								Mapa
							</Text>
						</Pressable>
						<Pressable
							style={[styles.expandedTab, expandedPanel === 'search' && styles.expandedTabActive]}
							onPress={() => setExpandedPanel('search')}
						>
							<MaterialCommunityIcons
								name="magnify"
								size={16}
								color={expandedPanel === 'search' ? '#e80000' : '#666'}
							/>
							<Text style={[styles.expandedTabText, expandedPanel === 'search' && styles.expandedTabTextActive]}>
								Buscar
							</Text>
						</Pressable>
					</View>

				{locationStatus === 'blocked' && (
					<View style={styles.banner}>
						<Text style={styles.bannerText}>Activa la ubicación para centrar el mapa en tu posición.</Text>
					</View>
				)}

				{routeError && (
					<View style={styles.routeBannerError}>
						<Text style={styles.routeBannerErrorText}>{routeError}</Text>
					</View>
				)}

				{reportNotice && !routeError && (
					<View style={styles.routeBannerInfo}>
						<MaterialCommunityIcons name="information-outline" size={18} color="#1d4ed8" />
						<Text style={styles.routeBannerInfoText}>{reportNotice}</Text>
					</View>
				)}

				{routeSummary && !routeError && (
					<View style={styles.routeBannerBlock}>
						<View style={styles.routeBanner}>
							<MaterialCommunityIcons name="routes" size={18} color="#0f5132" />
							<Text style={styles.routeBannerText}>{routeSummary}</Text>
						</View>
						{hasActiveRoute && (
							<Pressable
								style={styles.rerouteButton}
								onPress={handleReroutePress}
								disabled={isRouting || isRerouteBusy}
							>
								<MaterialCommunityIcons name="refresh" size={18} color="#fff" />
								<Text style={styles.rerouteButtonText}>Rerutear</Text>
							</Pressable>
						)}
					</View>
				)}

				{expandedPanel === 'map' && (
					<View style={[styles.mapCard, styles.mapCardExpanded, { marginBottom: 8 }]}>
						<MapView
							ref={mapRef}
							style={[styles.map, styles.mapExpanded]}
							region={region}
							onRegionChangeComplete={setRegion}
							showsCompass
							showsScale
							showsUserLocation
							showsMyLocationButton={false}
						>
							{ACCESSIBLE_POINTS.map((point) => (
								<Marker
									key={point.id}
									coordinate={{ latitude: point.latitude, longitude: point.longitude }}
									title={point.name}
									description={point.description}
									onPress={() => focusPoint(point)}
								>
									<View style={styles.markerWrap}>
										<View style={[styles.marker, { backgroundColor: point.accent }]}>
											<MaterialCommunityIcons name={point.icon} size={18} color="#fff" />
										</View>
									</View>
								</Marker>
							))}

							{destination && (
								<Marker
									coordinate={{
										latitude: destination.latitude,
										longitude: destination.longitude,
									}}
									title={destination.name}
									pinColor="#e80000"
								/>
							)}

							{routeCoordinates.length > 1 && (
								<Polyline
									coordinates={routeCoordinates}
									strokeColor="#e80000"
									strokeWidth={5}
									lineCap="round"
									lineJoin="round"
								/>
							)}
						</MapView>

						{isRouting && (
							<View style={styles.routingOverlay}>
								<ActivityIndicator color="#e80000" />
								<Text style={styles.routingOverlayText}>Calculando ruta accesible…</Text>
							</View>
						)}

					</View>
				)}

				{expandedPanel === 'search' && (
					<View style={[styles.searchPanel, { marginBottom: 10 + bottomInset }]}>
						<View style={styles.searchInputWrap}>
							<MaterialCommunityIcons name="magnify" size={20} color="#666" />
							<TextInput
								style={styles.searchInput}
								placeholder="Buscar lugar, calle o punto…"
								placeholderTextColor="#8b8b8b"
								value={searchQuery}
								onChangeText={setSearchQuery}
								autoCorrect={false}
								returnKeyType="search"
							/>
							{searchQuery.length > 0 && (
								<Pressable onPress={() => setSearchQuery('')}>
									<MaterialCommunityIcons name="close-circle" size={18} color="#999" />
								</Pressable>
							)}
						</View>

						{isSearching ? (
							<View style={styles.searchLoading}>
								<ActivityIndicator color="#e80000" />
								<Text style={styles.searchLoadingText}>Buscando lugares…</Text>
							</View>
						) : (
							<FlatList
								data={searchResults}
								keyExtractor={(item) => item.id}
								keyboardShouldPersistTaps="handled"
								ListEmptyComponent={
									<Text style={styles.searchEmpty}>
										{searchQuery.trim()
											? 'Sin resultados. Prueba con otro nombre o dirección.'
											: userLocation
												? 'Escribe para buscar lugares cerca de ti.'
												: 'Escribe para buscar (activa ubicación para resultados cercanos).'}
									</Text>
								}
								renderItem={({ item }) => (
									<Pressable style={styles.searchResultRow} onPress={() => handleSelectPlace(item)}>
										<View style={styles.searchResultIcon}>
											<MaterialCommunityIcons
												name={item.source === 'local' ? 'wheelchair-accessibility' : 'map-marker'}
												size={18}
												color="#e80000"
											/>
										</View>
										<View style={styles.searchResultText}>
											<Text style={styles.searchResultTitle}>{item.name}</Text>
											<Text style={styles.searchResultSubtitle} numberOfLines={2}>
												{item.subtitle}
											</Text>
										</View>
										<MaterialCommunityIcons name="routes" size={20} color="#111" />
									</Pressable>
								)}
							/>
						)}
					</View>
				)}

				{expandedPanel === 'map' && (
					<View style={[styles.expandedHint, { marginBottom: 10 + bottomInset }]}>
						<View style={styles.expandedHintDot} />
						<Text style={styles.expandedHintText}>{activeLabel}</Text>
						<Pressable
							style={styles.expandedRouteButton}
							onPress={() => {
								const target = destination ?? selectedPoint;
								void calculateRouteTo(
									{ latitude: target.latitude, longitude: target.longitude },
									target.name,
								);
							}}
							disabled={isRouting}
						>
							<MaterialCommunityIcons name="routes" size={16} color="#fff" />
						</Pressable>
					</View>
				)}
			</ScreenShell>

			<ReroutePromptModal
				visible={showRerouteModal}
				isBusy={isRerouteBusy}
				busyMessage={rerouteBusyMessage}
				onConfirmReport={() => void handleRerouteWithPhotoReport()}
				onSkipReport={() => void handleRerouteWithoutReport()}
				onCancel={closeRerouteModal}
			/>

			<ManualReportModal
				visible={showManualReportModal}
				errorHint={visionErrorHint}
				initialValue={prefillDescription ?? undefined}
				onSubmit={(text) => void handleManualReportSubmit(text)}
				onCancel={() => {
					setShowManualReportModal(false);
					setVisionErrorHint(null);
					setPrefillDescription(null);
				}}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f4f4f4',
	},
	header: {
		paddingHorizontal: 18,
		paddingTop: 8,
		paddingBottom: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	expandedTabs: {
		flexDirection: 'row',
		gap: 8,
		paddingHorizontal: 14,
		marginBottom: 8,
	},
	expandedTab: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		paddingVertical: 10,
		borderRadius: 14,
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: 'rgba(17, 24, 39, 0.08)',
	},
	expandedTabActive: {
		borderColor: '#e80000',
		backgroundColor: 'rgba(232, 0, 0, 0.06)',
	},
	expandedTabText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#666',
	},
	expandedTabTextActive: {
		color: '#e80000',
	},
	banner: {
		marginHorizontal: 18,
		marginBottom: 10,
		padding: 11,
		borderRadius: 14,
		backgroundColor: '#fff4e5',
		borderWidth: 1,
		borderColor: '#ffd8a8',
	},
	bannerText: {
		color: '#8b5e00',
		fontSize: 13,
		lineHeight: 18,
	},
	routeBannerBlock: {
		marginHorizontal: 14,
		marginBottom: 8,
		gap: 8,
	},
	routeBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 9,
		borderRadius: 12,
		backgroundColor: '#d1fae5',
		borderWidth: 1,
		borderColor: '#86efac',
	},
	routeBannerText: {
		flex: 1,
		color: '#0f5132',
		fontSize: 12,
		fontWeight: '700',
	},
	routeBannerInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginHorizontal: 14,
		marginBottom: 8,
		paddingHorizontal: 12,
		paddingVertical: 9,
		borderRadius: 12,
		backgroundColor: '#dbeafe',
		borderWidth: 1,
		borderColor: '#93c5fd',
	},
	routeBannerInfoText: {
		flex: 1,
		color: '#1e3a8a',
		fontSize: 12,
		fontWeight: '600',
	},
	rerouteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 11,
		borderRadius: 14,
		backgroundColor: '#111',
	},
	rerouteButtonText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '800',
	},
	routeBannerError: {
		marginHorizontal: 14,
		marginBottom: 8,
		paddingHorizontal: 12,
		paddingVertical: 9,
		borderRadius: 12,
		backgroundColor: '#fee2e2',
		borderWidth: 1,
		borderColor: '#fecaca',
	},
	routeBannerErrorText: {
		color: '#991b1b',
		fontSize: 12,
		lineHeight: 17,
	},
	mapCard: {
		flex: 1,
		marginHorizontal: 14,
		borderRadius: 24,
		overflow: 'hidden',
		backgroundColor: '#0f172a',
		borderWidth: 1,
		borderColor: 'rgba(17, 24, 39, 0.08)',
		shadowColor: '#000',
		shadowOpacity: 0.12,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 10 },
		elevation: 6,
	},
	map: {
		flex: 1,
		minHeight: 320,
	},
	mapExpanded: {
		minHeight: 420,
	},
	mapCardExpanded: {
		flex: 1,
		marginHorizontal: 0,
		borderRadius: 28,
	},
	markerWrap: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	marker: {
		width: 34,
		height: 34,
		borderRadius: 17,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: '#fff',
	},
	routingOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(255,255,255,0.72)',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	routingOverlayText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#111',
	},
	expandedHint: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginTop: 10,
		marginHorizontal: 14,
		borderRadius: 999,
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: 'rgba(17, 24, 39, 0.08)',
	},
	expandedHintDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: '#e80000',
	},
	expandedHintText: {
		flex: 1,
		fontSize: 13,
		fontWeight: '700',
		color: '#111',
	},
	expandedRouteButton: {
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: '#e80000',
		alignItems: 'center',
		justifyContent: 'center',
	},
	searchPanel: {
		flex: 1,
		marginHorizontal: 14,
		backgroundColor: '#fff',
		borderRadius: 22,
		borderWidth: 1,
		borderColor: 'rgba(17, 24, 39, 0.08)',
		padding: 12,
		minHeight: 320,
	},
	searchInputWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: '#f5f5f5',
		borderRadius: 14,
		paddingHorizontal: 12,
		paddingVertical: 10,
		marginBottom: 10,
	},
	searchInput: {
		flex: 1,
		fontSize: 15,
		color: '#111',
		paddingVertical: 0,
	},
	searchLoading: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	searchLoadingText: {
		fontSize: 13,
		color: '#666',
	},
	searchEmpty: {
		textAlign: 'center',
		color: '#666',
		fontSize: 13,
		lineHeight: 19,
		paddingVertical: 24,
		paddingHorizontal: 12,
	},
	searchResultRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(17, 24, 39, 0.06)',
	},
	searchResultIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: 'rgba(232, 0, 0, 0.08)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	searchResultText: {
		flex: 1,
	},
	searchResultTitle: {
		fontSize: 14,
		fontWeight: '800',
		color: '#111',
	},
	searchResultSubtitle: {
		marginTop: 3,
		fontSize: 12,
		color: '#666',
		lineHeight: 17,
	},
	headerCompact: {},
});