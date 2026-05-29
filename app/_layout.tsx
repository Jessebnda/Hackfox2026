import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import '../utils/background-location-task'; 

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <StatusBar style="dark" />
    </Stack>
  );
}
