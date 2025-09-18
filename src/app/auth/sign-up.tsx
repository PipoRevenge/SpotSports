import { VStack } from "@/src/components/ui/vstack";
import { SignUpForm } from "@/src/features/auth/components/sign-up-form";
import React from "react";

export default function SignUp() {
    return (
        <VStack className="flex-1 justify-center items-center bg-white px-4">
            <SignUpForm />
        </VStack>
    );
}