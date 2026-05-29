import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
	visible: boolean;
	placeName: string;
	isLoading: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

export default function PlaceValidationModal({
	visible,
	placeName,
	isLoading,
	onConfirm,
	onCancel,
}: Props) {
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
			<View style={styles.overlay}>
				<View style={styles.card}>
					{isLoading ? (
						<>
							<ActivityIndicator size="large" color="#e80000" style={styles.spinner} />
							<Text style={styles.title}>Verificando foto…</Text>
							<Text style={styles.message}>
								La comprobación de <Text style={styles.bold}>{placeName}</Text> fue aprobada. Quitando el lugar del mapa.
							</Text>
						</>
					) : (
						<>
							<View style={styles.iconRow}>
								<MaterialCommunityIcons name="camera-check" size={28} color="#e80000" />
							</View>
							<Text style={styles.title}>Foto de comprobación</Text>
							<Text style={styles.message}>
								Toma una foto para validar que <Text style={styles.bold}>{placeName}</Text> está bien. Esto es un placeholder y siempre confirmará correctamente.
							</Text>
							<View style={styles.actions}>
								<Pressable style={[styles.button, styles.buttonSecondary]} onPress={onCancel}>
									<Text style={styles.buttonSecondaryText}>Cancelar</Text>
								</Pressable>
								<Pressable style={[styles.button, styles.buttonPrimary]} onPress={onConfirm}>
									<MaterialCommunityIcons name="camera" size={16} color="#fff" />
									<Text style={styles.buttonPrimaryText}>Tomar foto y confirmar</Text>
								</Pressable>
							</View>
						</>
					)}
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(17, 24, 39, 0.45)',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	card: {
		backgroundColor: '#fff',
		borderRadius: 22,
		padding: 20,
	},
	iconRow: {
		alignItems: 'center',
		marginBottom: 10,
	},
	title: {
		fontSize: 18,
		fontWeight: '800',
		color: '#111',
		marginBottom: 8,
		textAlign: 'center',
	},
	message: {
		fontSize: 14,
		lineHeight: 20,
		color: '#444',
		textAlign: 'center',
		marginBottom: 18,
	},
	bold: {
		fontWeight: '700',
		color: '#111',
	},
	actions: {
		flexDirection: 'row',
		gap: 10,
		width: '100%',
	},
	button: {
		flex: 1,
		borderRadius: 14,
		paddingVertical: 13,
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 6,
	},
	buttonPrimary: {
		backgroundColor: '#e80000',
	},
	buttonPrimaryText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '800',
	},
	buttonSecondary: {
		backgroundColor: '#f5f5f5',
	},
	buttonSecondaryText: {
		color: '#111',
		fontSize: 14,
		fontWeight: '700',
	},
	spinner: {
		marginBottom: 16,
	},
});