import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type ManualReportModalProps = {
	visible: boolean;
	errorHint?: string | null;
	initialValue?: string;
	onSubmit: (description: string) => void;
	onCancel: () => void;
};

export default function ManualReportModal({
	visible,
	errorHint,
	initialValue,
	onSubmit,
	onCancel,
}: ManualReportModalProps) {
	const [text, setText] = useState('');

	useEffect(() => {
		if (visible) {
			setText(initialValue ?? '');
		}
	}, [visible, initialValue]);

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
			<View style={styles.overlay}>
				<View style={styles.card}>
					<Text style={styles.title}>
						{initialValue ? 'Confirma el reporte' : 'Describe el obstáculo'}
					</Text>
					<Text style={styles.message}>
						{initialValue
							? 'Revisa la descripción detectada y corrígela si es necesario.'
							: 'No se pudo analizar la foto automáticamente. Escribe qué ves (calle, rampa, obra, ruta bloqueada, etc.).'}
					</Text>

					{errorHint ? <Text style={styles.errorHint}>{errorHint}</Text> : null}

					<TextInput
						style={styles.input}
						placeholder="Ej. Calle bloqueada por obra, sin rampa…"
						placeholderTextColor="#8b8b8b"
						value={text}
						onChangeText={setText}
						multiline
						maxLength={400}
					/>

					<View style={styles.actions}>
						<Pressable style={[styles.button, styles.buttonSecondary]} onPress={onCancel}>
							<Text style={styles.buttonSecondaryText}>Cancelar</Text>
						</Pressable>
						<Pressable
							style={[styles.button, styles.buttonPrimary, !text.trim() && styles.buttonDisabled]}
							onPress={() => onSubmit(text.trim())}
							disabled={!text.trim()}
						>
							<Text style={styles.buttonPrimaryText}>Guardar y reajustar</Text>
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
		marginBottom: 10,
	},
	errorHint: {
		fontSize: 12,
		lineHeight: 17,
		color: '#991b1b',
		backgroundColor: '#fee2e2',
		padding: 10,
		borderRadius: 10,
		marginBottom: 10,
	},
	input: {
		minHeight: 88,
		maxHeight: 140,
		borderRadius: 14,
		backgroundColor: '#f5f5f5',
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 15,
		color: '#111',
		textAlignVertical: 'top',
		marginBottom: 14,
	},
	actions: {
		gap: 10,
	},
	button: {
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
	buttonDisabled: {
		opacity: 0.5,
	},
});
