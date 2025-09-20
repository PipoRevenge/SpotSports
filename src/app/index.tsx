import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();

  const routes = [
    { name: "Test", path: "/test/test-component" },
    { name: "Mapa", path: "/map" },
    { name: "Perfil", path: "/profile" },
    { name: "Sign out", path: "/auth/sign-out" },
    { name: "Sign Up", path: "/auth/sign-up" },
    { name: "Sign In", path: "/auth/sign-in" },
    { name: "Perfil", path: "/profile/profile-index" },
    { name: "Card-View", path: "/spot/spot-card-view" },
    { name: "spot", path: "/spot/spot-page" },
  ];

  return (
    <SafeAreaView style={styles.fullScreen}>
      <View style={styles.center}>
        <Text style={[styles.text, { fontSize: 24, fontWeight: 'bold', marginBottom: 20 }]}>
          SpotSport - Navegación
        </Text>

        <ScrollView style={{ width: '100%' }}>
          {routes.map((route, index) => (
            <TouchableOpacity
              key={index}
              style={styles.button}
              onPress={() => router.push(route.path)}
            >
              <Text style={styles.buttonText}>{route.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  center: {
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 16,
  },
  text: {
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
