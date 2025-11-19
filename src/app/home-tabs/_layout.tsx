import { Tabs } from 'expo-router';
import { Heart, Map, Newspaper, User } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0891b2', // Cyan-600
        tabBarInactiveTintColor: '#94a3b8', // Slate-400
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0', // Slate-200
        },
        // Usar replace para no acumular historial entre tabs
        tabBarHideOnKeyboard: true,
      }}
      backBehavior="history"
    >
      <Tabs.Screen
        name="search-map"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved-spots"
        options={{
          title: 'Saved Spots',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Newspaper size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
