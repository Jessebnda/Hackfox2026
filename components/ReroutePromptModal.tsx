import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type ReroutePromptModalProps = {
	visible: boolean;
	isBusy?: boolean;
	busyMessage?: string;
	onConfirmReport: () => void;
	onSkipReport: () => void;
	onCancel: () => void;
};

export default function ReroutePromptModal({
	visible,
	isBusy = false,
	busyMessage = 'Procesando…',
	onConfirmReport,
	onSkipReport,
	onCancel,
}: ReroutePromptModalProps) {
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
			<View style={styles.overlay}>
				<View style={styles.card}>
					<Text style={styles.title}>Reajustar ruta</Text>
					<Text style={styles.message}>
						¿Quieres marcar la razón del cambio? Puedes tomar una foto del obstáculo o situación en la vía.
					</Text>

					{isBusy ? (
						<View style={styles.busyRow}>
							<ActivityIndicator color="#e80000" />
							<Text style={styles.busyText}>{busyMessage}</Text>
						</View>
					) : (
						<View style={styles.actions}>
							<Pressable style={[styles.button, styles.buttonSecondary]} onPress={onSkipReport}>
								<Text style={styles.buttonSecondaryText}>No, solo reajustar</Text>
							</Pressable>
							<Pressable style={[styles.button, styles.buttonPrimary]} onPress={onConfirmReport}>
								<Text style={styles.buttonPrimaryText}>Sí, tomar foto</Text>
							</Pressable>
						</View>
					)}

					{!isBusy && (
						<Pressable style={styles.cancelLink} onPress={onCancel}>
							<Text style={styles.cancelText}>Cancelar</Text>
						</Pressable>
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
		borderWidth: 1,
		borderColor: 'rgba(17, 24, 39, 0.08)',
	},
	title: {
		fontSize: 18,
		fontWeight: '800',
		color: '#111',
		marginBottom: 8,
	},
	message: {
		fontSize: 14,
		lineHeight: 20,
		color: '#444',
		marginBottom: 16,
	},
	actions: {
		gap: 10,
	},
	button: {
		borderRadius: 14,
		paddingVertical: 13,
		paddingHorizontal: 14,
		alignItems: 'center',
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
		borderWidth: 1,
		borderColor: 'rgba(17, 24, 39, 0.08)',
	},
	buttonSecondaryText: {
		color: '#111',
		fontSize: 14,
		fontWeight: '700',
	},
	busyRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 8,
	},
	busyText: {
		fontSize: 13,
		color: '#444',
		flex: 1,
	},
	cancelLink: {
		marginTop: 12,
		alignItems: 'center',
	},
	cancelText: {
		fontSize: 13,
		color: '#666',
		fontWeight: '600',
	},
});
