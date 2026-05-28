import { MaterialCommunityIcons } from '@expo/vector-icons';

export type AccessiblePoint = {
	id: string;
	name: string;
	description: string;
	latitude: number;
	longitude: number;
	icon: keyof typeof MaterialCommunityIcons.glyphMap;
	accent: string;
};

export const ACCESSIBLE_POINTS: AccessiblePoint[] = [
	{
		id: 'rampas-central',
		name: 'Ruta con rampas',
		description: 'Acceso principal con entrada amplia y retorno cercano.',
		latitude: 32.5159,
		longitude: -117.0358,
		icon: 'wheelchair-accessibility',
		accent: '#e80000',
	},
	{
		id: 'apoyo-sanitario',
		name: 'Punto de apoyo',
		description: 'Baño accesible y zona de descanso en trayecto corto.',
		latitude: 32.5129,
		longitude: -117.0431,
		icon: 'toilet',
		accent: '#111111',
	},
	{
		id: 'zona-segura',
		name: 'Zona segura',
		description: 'Punto de reunión con andador y espacio libre.',
		latitude: 32.5098,
		longitude: -117.0387,
		icon: 'shield-check-outline',
		accent: '#334155',
	},
];
