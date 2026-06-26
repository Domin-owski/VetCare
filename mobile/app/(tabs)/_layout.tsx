import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTintColor: "#17324d",
        headerTitleStyle: {
          fontWeight: "800",
        },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#697b8c",
        tabBarStyle: {
          height: 84,
          paddingTop: 7,
          paddingBottom: 22,
        },
      }}
    >
      <Tabs.Screen
        name="pets"
        options={{
          title: "Zwierzęta",
          headerTitle: "VetCare",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: "Dodaj",
          headerTitle: "Dodaj zwierzę",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="add-circle"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="about"
        options={{
          title: "Informacje",
          headerTitle: "O aplikacji",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="information-circle"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}