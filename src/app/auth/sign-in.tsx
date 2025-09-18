import { VStack } from "@/src/components/ui/vstack";
import { SignInForm } from "@/src/features/auth/components/sign-in-form";
import React from "react";

export default function SignIn() {
    return (
        <VStack className="flex-1 justify-center items-center bg-white px-4">
            <SignInForm />
        </VStack>
    );
}