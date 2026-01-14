import 'dotenv/config';
import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: config.name ?? 'SpotsSports',
    slug: config.slug ?? 'SpotsSports',
    plugins: [
      ...(((config.plugins ?? []) as (string | [] | [string] | [string, any])[]).map((plugin): string | [] | [string] | [string, any] => {
        if (Array.isArray(plugin) && plugin[0] === 'react-native-maps') {
          const pluginTuple = plugin as [string, any];
          return [
            'react-native-maps',
            {
              ...pluginTuple[1],
              androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
            },
          ];
        }
        return plugin;
      }) as (string | [] | [string] | [string, any])[]),
    ],
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
