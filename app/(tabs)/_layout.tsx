import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, Text, View } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: '#f5f5f5',
        },
        headerTitleAlign: 'left',
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#111' }}>Hack</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#e80000' }}>fox</Text>
          </View>
        ),
        tabBarActiveTintColor: '#e80000',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 10,
          height: 74,
          borderRadius: 22,
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(17, 24, 39, 0.08)',
          paddingBottom: Platform.OS === 'ios' ? 8 : 6,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOpacity: 0.14,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="map-marker-radius" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: "Asistente",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="robot-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
