import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
	visible: boolean;
	barrierTitle: string;
	barrierDescription: string;
	onDelete: () => void;
	onCancel: () => void;
};

export default function BarrierDeleteModal({
	visible,
	barrierTitle,
	barrierDescription,
	onDelete,
	onCancel,
}: Props) {
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
			<View style={styles.overlay}>
				<View style={styles.card}>
					<Text style={styles.title}>Eliminar barrera</Text>
					<Text style={styles.message}>
						¿Quieres borrar <Text style={styles.bold}>{barrierTitle}</Text>?
					</Text>
					<Text style={styles.description}>{barrierDescription}</Text>
					<View style={styles.actions}>
						<Pressable style={[styles.button, styles.buttonSecondary]} onPress={onCancel}>
							<Text style={styles.buttonSecondaryText}>Cancelar</Text>
						</Pressable>
						<Pressable style={[styles.button, styles.buttonPrimary]} onPress={onDelete}>
							<Text style={styles.buttonPrimaryText}>Sí, borrar</Text>
						</Pressable>
					</View>
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
		marginBottom: 8,
	},
	description: {
		fontSize: 13,
		lineHeight: 19,
		color: '#666',
		marginBottom: 16,
	},
	bold: {
		fontWeight: '700',
		color: '#111',
	},
	actions: {
		flexDirection: 'row',
		gap: 10,
	},
	button: {
		flex: 1,
		borderRadius: 14,
		paddingVertical: 13,
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
	},
	buttonSecondaryText: {
		color: '#111',
		fontSize: 14,
		fontWeight: '700',
	},
});