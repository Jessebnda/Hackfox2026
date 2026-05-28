import { Region } from 'react-native-maps';

export const TIJUANA_CENTER = {
	latitude: 32.5149,
	longitude: -117.0382,
};

export const DEFAULT_REGION: Region = {
	...TIJUANA_CENTER,
	latitudeDelta: 0.08,
	longitudeDelta: 0.08,
};