// Design tokens extraídos del sistema visual de Hackfox 2026

export const Colors = {
	// Fondo
	background: '#f4f4f4',
	surface: '#fff',
	field: '#f5f5f5',

	// Acento principal
	primary: '#e80000',
	primaryMuted: 'rgba(232, 0, 0, 0.08)',

	// Texto
	textPrimary: '#111',
	textSecondary: '#444',
	textMuted: '#666',
	textPlaceholder: '#8b8b8b',

	// Bordes
	border: 'rgba(17, 24, 39, 0.08)',
	borderSubtle: 'rgba(17, 24, 39, 0.06)',

	// Overlay (modales)
	overlay: 'rgba(17, 24, 39, 0.45)',

	// Semánticos — éxito/ruta
	successBg: '#d1fae5',
	successText: '#0f5132',
	successBorder: '#86efac',

	// Semánticos — info
	infoBg: '#dbeafe',
	infoText: '#1e3a8a',
	infoBorder: '#93c5fd',

	// Semánticos — advertencia
	warningBg: '#fff4e5',
	warningText: '#8b5e00',
	warningBorder: '#ffd8a8',

	// Semánticos — error
	errorBg: '#fee2e2',
	errorText: '#991b1b',
	errorBorder: '#fecaca',
} as const;

export const Radius = {
	sm: 10,
	md: 14,
	lg: 22,
	xl: 28,
	full: 999,
} as const;

// Tres niveles de elevación — aplica todos los props juntos
export const Shadow = {
	sm: {
		shadowColor: '#000',
		shadowOpacity: 0.06,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	md: {
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 8 },
		elevation: 4,
	},
	lg: {
		shadowColor: '#000',
		shadowOpacity: 0.12,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 10 },
		elevation: 6,
	},
} as const;

export const Typography = {
	display: { fontSize: 18, fontWeight: '800' as const, color: Colors.textPrimary },
	title:   { fontSize: 16, fontWeight: '700' as const, color: Colors.textPrimary },
	bodyBold:{ fontSize: 15, fontWeight: '700' as const, color: Colors.textPrimary },
	body:    { fontSize: 15, lineHeight: 21, color: Colors.textPrimary },
	label:   { fontSize: 14, fontWeight: '700' as const, color: Colors.textPrimary },
	caption: { fontSize: 13, color: Colors.textMuted },
	small:   { fontSize: 12, color: Colors.textMuted },
} as const;

export const Spacing = {
	xs:  4,
	sm:  8,
	md:  12,
	lg:  16,
	xl:  20,
	xxl: 24,
} as const;

// Bloques reutilizables listos para StyleSheet
export const Card = {
	base: {
		backgroundColor: Colors.surface,
		borderRadius: Radius.lg,
		borderWidth: 1,
		borderColor: Colors.border,
		...Shadow.md,
	},
	flat: {
		backgroundColor: Colors.surface,
		borderRadius: Radius.lg,
		borderWidth: 1,
		borderColor: Colors.border,
	},
} as const;

export const Button = {
	primary: {
		backgroundColor: Colors.primary,
		borderRadius: Radius.md,
		paddingVertical: 13,
		alignItems: 'center' as const,
	},
	primaryText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '800' as const,
	},
	secondary: {
		backgroundColor: Colors.field,
		borderRadius: Radius.md,
		paddingVertical: 13,
		alignItems: 'center' as const,
	},
	secondaryText: {
		color: Colors.textPrimary,
		fontSize: 14,
		fontWeight: '700' as const,
	},
	icon: {
		backgroundColor: Colors.surface,
		borderRadius: Radius.full,
		borderWidth: 1,
		borderColor: Colors.border,
		padding: 10,
	},
} as const;
