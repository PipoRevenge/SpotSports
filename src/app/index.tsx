import { useUser } from '@/src/context/user-context';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { user, isLoading, isAuthenticated } = useUser();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // User is authenticated and data loaded, navigate to main app
        router.replace('/home-tabs/my-feed');
      } else {
        // Not authenticated, navigate to auth screen
        router.replace('/auth/authentication');
      }
    }
  }, [isLoading, isAuthenticated, user]);

  // Show splash screen while loading
  return (
    <SafeAreaView style={styles.fullScreen}>
      <View style={styles.center}>
        <Image 
          source={require('@/src/assets/images/app-logo/logo-filled.png')} // Ensure the logo is placed in the correct path
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#ffffff', // Optional: Set a background color
  },
  center: {
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
  },
  logo: {
    width: 200, // Adjust the size of the logo as needed
    height: 200,
  },
});
