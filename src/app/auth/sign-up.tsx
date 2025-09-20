import { SignUpForm } from "@/src/features/auth/components/sign-up-form";
import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUp() {
    return (
        <SafeAreaView>
        <ScrollView>

            <SignUpForm />

        </ScrollView>
        </SafeAreaView>
    );
}