import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeKeyboardInset } from '@/constants/keyboard';

export function useKeyboardInset(bottomInset = 0) {
	const insets = useSafeAreaInsets();
	const [keyboardInset, setKeyboardInset] = useState(0);
	const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

	useEffect(() => {
		const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
		const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

		const onShow = (event: KeyboardEvent) => {
			const height = event.endCoordinates.height;
			setKeyboardInset(computeKeyboardInset(height, bottomInset, insets.bottom));
			setIsKeyboardVisible(true);
		};

		const onHide = () => {
			setKeyboardInset(0);
			setIsKeyboardVisible(false);
		};

		const showSubscription = Keyboard.addListener(showEvent, onShow);
		const hideSubscription = Keyboard.addListener(hideEvent, onHide);

		return () => {
			showSubscription.remove();
			hideSubscription.remove();
		};
	}, [bottomInset, insets.bottom]);

	return { keyboardInset, isKeyboardVisible };
}
