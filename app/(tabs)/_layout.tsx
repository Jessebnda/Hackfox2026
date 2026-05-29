import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { SvgXml } from "react-native-svg";

const TGUIA_LOGO = `<svg viewBox="0 0 480 310" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(180, 10) scale(0.48)">
    <path d="M100,252 C55,177 20,150 20,95 A80,80 0 1 1 180,95 C180,150 145,177 100,252 Z" fill="#e80000"/>
    <circle cx="83" cy="113" r="27" fill="#ffffff"/>
    <circle cx="83" cy="113" r="18" fill="#e80000"/>
    <circle cx="96" cy="46" r="11.5" fill="#ffffff"/>
    <line x1="94" y1="58" x2="88" y2="90" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
    <line x1="92" y1="71" x2="122" y2="67" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
    <line x1="88" y1="90" x2="114" y2="90" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
    <line x1="113" y1="90" x2="120" y2="108" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
    <line x1="120" y1="108" x2="131" y2="108" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
  </g>
  <text font-size="78" font-weight="800" x="240" y="226" text-anchor="middle">
    <tspan fill="#e80000">t</tspan><tspan fill="#111111">-gu</tspan><tspan fill="#e80000">IA</tspan>
  </text>
  <text font-size="24" font-weight="600" letter-spacing="3" x="242" y="268" text-anchor="middle" fill="#111111">TIJUANA ACCESIBLE</text>
</svg>`;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: '#f5f5f5',
          height: 80,
        },
        headerTitleAlign: 'left',
        headerTitle: () => (
          <SvgXml xml={TGUIA_LOGO} width={96} height={62} />
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
          title: "T-bot",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="robot-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
