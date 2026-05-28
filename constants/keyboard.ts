import { Platform } from 'react-native';

/**
 * Ajuste del inset del teclado respecto a la altura reportada por el SO.
 *
 * iOS: el teclado suele medir ~260–336 pt; la tab bar flotante (~84 pt) sigue visible
 * detrás del teclado, así que no hace falta desplazar el 100% de la altura.
 * Android: `windowSoftInputMode` ya redimensiona la ventana; un factor algo mayor compensa
 * la barra de navegación y el input multilínea.
 */
export const KEYBOARD_INSET_CONFIG = {
	ios: {
		heightFactor: 0.72,
		minInset: 12,
		extraPadding: 8,
	},
	android: {
		heightFactor: 0.88,
		minInset: 10,
		extraPadding: 6,
	},
} as const;

export function computeKeyboardInset(
	keyboardHeight: number,
	bottomInset: number,
	safeAreaBottom: number,
): number {
	if (keyboardHeight <= 0) {
		return 0;
	}

	const config = Platform.OS === 'ios' ? KEYBOARD_INSET_CONFIG.ios : KEYBOARD_INSET_CONFIG.android;
	const tabBarOverlap = Math.min(bottomInset, keyboardHeight * 0.45);
	const safeOverlap = Platform.OS === 'ios' ? safeAreaBottom * 0.5 : 0;

	const rawInset =
		keyboardHeight * config.heightFactor - tabBarOverlap - safeOverlap + config.extraPadding;

	return Math.max(config.minInset, Math.round(rawInset));
}
