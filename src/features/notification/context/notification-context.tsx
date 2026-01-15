import { notificationRepository } from "@/src/api/repositories";
import { useUser } from "@/src/context/user-context"; // Updated based on file checking
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationContextType {
  expoPushToken: string | undefined;
  notification: Notifications.Notification | undefined;
  error: Error | null;
  registerForPushNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>("");
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const [error, setError] = useState<Error | null>(null);

  const notificationListener = React.useRef<
    Notifications.Subscription | undefined
  >(undefined);
  const responseListener = React.useRef<Notifications.Subscription | undefined>(
    undefined
  );

  // Use useUser instead of useAuth if that's what we find
  const { user } = useUser();

  const registerForPushNotificationsAsync = async () => {
    console.log("[NotificationContext] Starting registration process...");
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      if (!Device.isDevice) {
        console.log(
          "[NotificationContext] Must use physical device for Push Notifications"
        );
        // We continue in dev mode just in case, or we can return.
        // For now, let's allow it to try if it's an emulator behaving like a device
        // return;
      }

      console.log("[NotificationContext] Checking permissions...");
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      console.log("[NotificationContext] Existing status:", existingStatus);

      if (existingStatus !== "granted") {
        console.log("[NotificationContext] Requesting permissions...");
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log("[NotificationContext] New status:", finalStatus);
      }

      if (finalStatus !== "granted") {
        const msg =
          "Failed to get push token for push notification! Status: " +
          finalStatus;
        console.error("[NotificationContext]", msg);
        setError(new Error(msg));
        return;
      }

      console.log("[NotificationContext] Getting Expo Push Token...");
      // Check if project ID is needed, but try default first
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      console.log("[NotificationContext] Token obtained:", token);

      setExpoPushToken(token);

      console.log("[NotificationContext] User ID:", user?.id);
      if (user?.id && token) {
        // Register with backend
        console.log("[NotificationContext] Registering with backend...");
        await notificationRepository.registerPushToken(user.id, token);
        console.log("[NotificationContext] Backend registration complete.");
      } else {
        console.warn(
          "[NotificationContext] Skipping backend registration (Missing user ID or token)"
        );
      }
    } catch (e: any) {
      setError(e);
      console.error("[NotificationContext] Error getting push token:", e);
    }
  };

  useEffect(() => {
    // Call register on mount or when user changes
    registerForPushNotificationsAsync();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response received:", response);
      });

    return () => {
      // Clean up subscriptions
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.id]);

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        error,
        registerForPushNotifications: registerForPushNotificationsAsync,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
