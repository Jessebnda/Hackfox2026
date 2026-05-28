import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

type ScreenShellProps = PropsWithChildren<{
	maxWidth?: number;
}>;

export default function ScreenShell({ children, maxWidth = 430 }: ScreenShellProps) {
	return (
		<View style={styles.outer}>
			<View style={[styles.inner, { maxWidth }]}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	outer: {
		flex: 1,
		paddingHorizontal: 12,
	},
	inner: {
		flex: 1,
		width: '100%',
		alignSelf: 'center',
	},
});