// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          'paths': [
            {
              'name': 'react-native',
              'importNames': ['Alert'],
              'message': 'Use the app-alert context (useAppAlert) instead of Alert.alert to keep consistent UI.'
            }
          ]
        }
      ]
    },
  },
]);
