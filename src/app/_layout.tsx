import '@/global.css';
import { GluestackUIProvider } from '@components/ui/gluestack-ui-provider';

import { Stack } from "expo-router";
import { AppAlertProvider } from '../context/app-alert-context';
import { UserProvider } from '../context/user-context';
import { SelectedSpotProvider } from '../features/spot';

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="system" >
      <AppAlertProvider>
        <UserProvider>
          <SelectedSpotProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </SelectedSpotProvider>
        </UserProvider>
      </AppAlertProvider>
    </GluestackUIProvider>
  );
}
