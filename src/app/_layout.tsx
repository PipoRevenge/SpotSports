import '@/global.css';
import { GluestackUIProvider } from '@components/ui/gluestack-ui-provider';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from "expo-router";
import { AppAlertProvider } from '../context/app-alert-context';
import { MapSearchProvider } from '../context/map-search-context';
import { UserProvider } from '../context/user-context';
import { SelectedSpotProvider } from '../features/spot';
import { persistOptions, queryClient } from '../lib/react-query';

export default function RootLayout() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <GluestackUIProvider mode="system" >
        <AppAlertProvider>
          <UserProvider>
            <MapSearchProvider>
              <SelectedSpotProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </SelectedSpotProvider>
            </MapSearchProvider>
          </UserProvider>
        </AppAlertProvider>
      </GluestackUIProvider>
    </PersistQueryClientProvider>
  );
}
