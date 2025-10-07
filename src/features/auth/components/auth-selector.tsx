import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import React from 'react';

interface AuthSelectorProps {
  onSelectSignIn: () => void;
  onSelectSignUp: () => void;
}

const AUTH_BUTTON_STYLES = {
  minWidth: 200,
} as const;

const AUTH_TEXT_STYLES = {
  signIn: { color: 'white', fontWeight: 'bold' as const },
  signUp: { fontWeight: 'bold' as const },
} as const;

export const AuthSelector = ({ onSelectSignIn, onSelectSignUp }: AuthSelectorProps) => {
  return (
    <VStack style={{ gap: 16 }}>
      <Button
        size="lg"
        onPress={onSelectSignIn}
        style={AUTH_BUTTON_STYLES}
        testID="auth-sign-in-button"
      >
        <Text style={AUTH_TEXT_STYLES.signIn}>Sign In</Text>
      </Button>

      <Button
        size="lg"
        variant="outline"
        onPress={onSelectSignUp}
        style={AUTH_BUTTON_STYLES}
        testID="auth-sign-up-button"
      >
        <Text style={AUTH_TEXT_STYLES.signUp}>Sign Up</Text>
      </Button>
    </VStack>
  );
};