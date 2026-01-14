import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

// Configure how notifications should handle when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotificationListener = () => {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleNavigation = (data: Notifications.Notification['request']['content']['data']) => {
      if (data?.url) {
        try {
            router.push(data.url as any);
        } catch (e) {
            console.error('Navigation failed', e);
        }
      }
    };

    // Handle cold start when the app is opened from a notification
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!isMounted || !response) return;
        handleNavigation(response.notification.request.content.data);
      })
      .catch((error) => console.error('Error reading last notification response', error));

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        // You could handle custom UI updates here or let the system alert show
        console.log('Notification received in foreground:', notification.request.content.title);
    });

    // This listener is fired whenever a user taps on or interacts with a notification
    // (works when app is foreground, background, or killed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped with data:', data);
      handleNavigation(data);
    });

    return () => {
      isMounted = false;
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, [router]);
};
