import '@/global.css';
import { GluestackUIProvider } from '@components/ui/gluestack-ui-provider';

import { Stack } from "expo-router";
import { NotificationProvider } from '../context/notification-context';
import { UserProvider } from '../context/user-context';
import { SelectedSpotProvider } from '../features/spot';

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="system" >
      <NotificationProvider>
        <UserProvider>
          <SelectedSpotProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </SelectedSpotProvider>
        </UserProvider>
      </NotificationProvider>
    </GluestackUIProvider>
  );
}
