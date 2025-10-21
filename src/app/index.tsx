import React from 'react';
import { Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
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
