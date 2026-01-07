import 'dotenv/config';
import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: config.name ?? 'SpotsSports',
    slug: config.slug ?? 'SpotsSports',
    plugins: config.plugins?.map((plugin) => {
      if (Array.isArray(plugin) && plugin[0] === 'react-native-maps') {
        return [
          'react-native-maps',
          {
            ...plugin[1],
            androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
          },
        ];
      }
      return plugin;
    }),
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
  };
};
