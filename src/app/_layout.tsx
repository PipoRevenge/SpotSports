import '@/global.css';
import { GluestackUIProvider } from '@components/ui/gluestack-ui-provider';

import { Stack } from "expo-router";
import { UserProvider } from '../context/user-context';

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="system">
      <UserProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </UserProvider>
    </GluestackUIProvider>
  );
}
