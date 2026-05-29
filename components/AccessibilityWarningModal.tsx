import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AccessibilityResult } from '@/services/accessibilityAnalysis';

type Props = {
	visible: boolean;
	result: AccessibilityResult | null;
	onContinue: () => void;
	onCancel: () => void;
};

function getStreetViewUrl(lat: number, lng: number): string | null {
	const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
	if (!apiKey) {
		return null;
	}

	return `https://maps.googleapis.com/maps/api/streetview?size=640x280&location=${lat},${lng}&fov=90&key=${apiKey}`;
}

function DetailRow({ label, value }: { label: string; value: boolean | string }) {
	const isBool = typeof value === 'boolean';
	const isOk = isBool ? value : value === 'bueno';
	const icon = isOk ? 'check-circle' : 'close-circle';
	const color = isOk ? '#16a34a' : '#dc2626';

	return (
		<View style={styles.detailRow}>
			<MaterialCommunityIcons name={icon} size={16} color={color} />
			<Text style={styles.detailLabel}>{label}</Text>
			<Text style={[styles.detailValue, { color }]}>
				{isBool ? (value ? 'Sí' : 'No') : value}
			</Text>
		</View>
	);
}

export default function AccessibilityWarningModal({ visible, result, onContinue, onCancel }: Props) {
	if (!result) {
		return null;
	}

	const streetViewUrl = getStreetViewUrl(result.lat, result.lng);

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
			<View style={styles.overlay}>
				<View style={styles.card}>
					<ScrollView showsVerticalScrollIndicator={false} bounces={false}>
						<View style={styles.header}>
							<MaterialCommunityIcons name="alert-circle" size={28} color="#dc2626" />
							<Text style={styles.title}>Destino poco accesible</Text>
						</View>

						<Text style={styles.placeName}>{result.lugar}</Text>

						<View style={styles.scoreBadge}>
							<Text style={styles.scoreText}>
								Puntaje: {result.puntaje}/{result.puntaje_max}
							</Text>
						</View>

						{streetViewUrl ? (
							<Image
								source={{ uri: streetViewUrl }}
								style={styles.streetView}
								resizeMode="cover"
							/>
						) : null}

						<Text style={styles.resumen}>{result.resumen}</Text>

						<Text style={styles.sectionTitle}>Detalles</Text>
						<View style={styles.detailsCard}>
							<DetailRow label="Rampa de acceso" value={result.detalles.rampa} />
							<DetailRow label="Escalones" value={!result.detalles.escalones} />
							<DetailRow label="Estacionamiento accesible" value={result.detalles.estacionamiento_accesible} />
							<DetailRow label="Banqueta" value={result.detalles.banqueta_estado} />
							<DetailRow label="Entrada ancha" value={result.detalles.entrada_ancha} />
							<DetailRow label="Sin obstáculos" value={!result.detalles.obstaculos} />
						</View>

						<Text style={styles.recomendacion}>{result.recomendacion}</Text>
					</ScrollView>

					<View style={styles.actions}>
						<Pressable
							style={[styles.button, styles.buttonStreetView]}
							onPress={async () => {
								const { lat, lng } = result;
								const androidUrl = `google.streetview:cbll=${lat},${lng}`;
								const iosUrl = `comgooglemaps://?center=${lat},${lng}&views=streetview`;
								const webUrl = `https://maps.google.com/?cbll=${lat},${lng}&layer=c`;

								if (Platform.OS === 'android') {
									const canOpen = await Linking.canOpenURL(androidUrl);
									await Linking.openURL(canOpen ? androidUrl : webUrl);
								} else {
									const canOpen = await Linking.canOpenURL(iosUrl);
									await Linking.openURL(canOpen ? iosUrl : webUrl);
								}
							}}
						>
							<MaterialCommunityIcons name="google-maps" size={16} color="#1a73e8" />
							<Text style={styles.buttonStreetViewText}>Ver en Street View</Text>
						</Pressable>
						<View style={styles.actionsRow}>
							<Pressable style={[styles.button, styles.buttonSecondary]} onPress={onCancel}>
								<Text style={styles.buttonSecondaryText}>Cancelar ruta</Text>
							</Pressable>
							<Pressable style={[styles.button, styles.buttonPrimary]} onPress={onContinue}>
								<Text style={styles.buttonPrimaryText}>Continuar</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(17, 24, 39, 0.55)',
		justifyContent: 'flex-end',
	},
	card: {
		backgroundColor: '#fff',
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		padding: 20,
		maxHeight: '88%',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 6,
	},
	title: {
		fontSize: 19,
		fontWeight: '800',
		color: '#dc2626',
	},
	placeName: {
		fontSize: 14,
		fontWeight: '700',
		color: '#111',
		marginBottom: 8,
	},
	scoreBadge: {
		alignSelf: 'flex-start',
		backgroundColor: '#fee2e2',
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 5,
		marginBottom: 12,
	},
	scoreText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#991b1b',
	},
	streetView: {
		width: '100%',
		height: 180,
		borderRadius: 14,
		marginBottom: 14,
		backgroundColor: '#f5f5f5',
	},
	resumen: {
		fontSize: 13,
		lineHeight: 19,
		color: '#444',
		marginBottom: 14,
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: '800',
		color: '#111',
		marginBottom: 8,
	},
	detailsCard: {
		backgroundColor: '#f9fafb',
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 10,
		gap: 8,
		marginBottom: 12,
	},
	detailRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	detailLabel: {
		flex: 1,
		fontSize: 13,
		color: '#333',
	},
	detailValue: {
		fontSize: 13,
		fontWeight: '700',
	},
	recomendacion: {
		fontSize: 12,
		lineHeight: 18,
		color: '#666',
		backgroundColor: '#fff7ed',
		padding: 12,
		borderRadius: 12,
		marginBottom: 16,
	},
	actions: {
		gap: 10,
		paddingTop: 4,
	},
	actionsRow: {
		flexDirection: 'row',
		gap: 10,
	},
	button: {
		borderRadius: 14,
		paddingVertical: 13,
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 6,
	},
	buttonPrimary: {
		flex: 1,
		backgroundColor: '#e80000',
	},
	buttonPrimaryText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '800',
	},
	buttonSecondary: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	buttonSecondaryText: {
		color: '#111',
		fontSize: 14,
		fontWeight: '700',
	},
	buttonStreetView: {
		backgroundColor: '#e8f0fe',
		borderWidth: 1,
		borderColor: '#c5d8fc',
	},
	buttonStreetViewText: {
		color: '#1a73e8',
		fontSize: 14,
		fontWeight: '700',
	},
});
