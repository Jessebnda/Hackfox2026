import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
	visible: boolean;
	placeName: string;
	isLoading: boolean;
	onConfirm: () => void;
	onSkip: () => void;
};

export default function AccessibilityPromptModal({ visible, placeName, isLoading, onConfirm, onSkip }: Props) {
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
			<View style={styles.overlay}>
				<View style={styles.card}>
					{isLoading ? (
						<>
							<ActivityIndicator size="large" color="#e80000" style={styles.spinner} />
							<Text style={styles.loadingTitle}>Analizando destino…</Text>
							<Text style={styles.loadingSubtitle}>
								Revisando fotos de Street View de "{placeName}"
							</Text>
						</>
					) : (
						<>
							<View style={styles.iconRow}>
								<MaterialCommunityIcons name="wheelchair-accessibility" size={28} color="#e80000" />
							</View>
							<Text style={styles.title}>¿Analizar accesibilidad?</Text>
							<Text style={styles.message}>
								Podemos verificar si <Text style={styles.bold}>{placeName}</Text> es accesible para silla de ruedas usando fotos de Street View. Tarda unos segundos.
							</Text>
							<View style={styles.actions}>
								<Pressable style={[styles.button, styles.buttonSecondary]} onPress={onSkip}>
									<Text style={styles.buttonSecondaryText}>Omitir</Text>
								</Pressable>
								<Pressable style={[styles.button, styles.buttonPrimary]} onPress={onConfirm}>
									<MaterialCommunityIcons name="magnify" size={16} color="#fff" />
									<Text style={styles.buttonPrimaryText}>Analizar</Text>
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
		backgroundColor: 'rgba(17, 24, 39, 0.5)',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	card: {
		backgroundColor: '#fff',
		borderRadius: 22,
		padding: 22,
		alignItems: 'center',
	},
	iconRow: {
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
	loadingTitle: {
		fontSize: 17,
		fontWeight: '800',
		color: '#111',
		marginBottom: 6,
		textAlign: 'center',
	},
	loadingSubtitle: {
		fontSize: 13,
		color: '#666',
		textAlign: 'center',
		lineHeight: 18,
	},
});
