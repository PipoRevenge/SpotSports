import { Button, ButtonText } from "@/src/components/ui/button";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { SignInForm } from "@/src/features/auth/components/sign-in-form";
import { useSignIn } from "@/src/features/auth/hooks/use-sign-in";

import { useAppAlert } from "@/src/context/app-alert-context";
import { useUser } from "@/src/context/user-context";
import { Redirect, useRouter } from "expo-router";
import React, { useState } from "react";

export default function SignIn() {
  const router = useRouter();
  const { signIn, isLoading, error } = useSignIn();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();

  const { showError } = useAppAlert();

  const onSignInSubmit = async (email: string, password: string) => {
    try {
      setIsSubmitting(true);
      const result = await signIn(email, password);

      if (!result.success) {
        showError(
          result.error ||
            "Email or password incorrect. Please check your credentials.",
          "Sign In Error",
        );
      } else {
        // User data is now loaded in UserContext, navigate to home via Redirect component
      }
    } catch (signInError) {
      console.error("Sign in error:", signInError);
      showError(
        error || "An unexpected error occurred. Please try again.",
        "Error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpPress = () => {
    router.push("/auth/sign-up");
  };

  if (user) {
    return <Redirect href="/home-tabs/my-profile" />;
  }

  return (
    <VStack className="w-3/4 self-center justify-center flex-1">
      <SignInForm
        onSubmit={onSignInSubmit}
        onSignUpPress={handleSignUpPress}
        isLoading={isLoading || isSubmitting}
      />

      <VStack className="align-middle items-center gap-6 p-4">
        <Text>Don&apos;t have an account?</Text>
        <Button variant={"outline"} onPress={handleSignUpPress}>
          <ButtonText variant={"link"}>Create Account</ButtonText>
        </Button>

        <Button onPress={() => router.back()} variant={"outline"}>
          <ButtonText variant={"link"}>Go Back</ButtonText>
        </Button>
      </VStack>
    </VStack>
  );
}
