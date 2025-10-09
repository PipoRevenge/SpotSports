import { ProfileEditForm } from "@/src/features/user-profile";
import { router } from "expo-router";
import React from "react";

export default function ProfileEditPage() {
    const handleSave = () => {
        // Navegar de vuelta al perfil después de guardar
        router.back();
    };

    const handleCancel = () => {
        // Navegar de vuelta sin guardar
        router.back();
    };

    return (
        <ProfileEditForm
            onSave={handleSave}
            onCancel={handleCancel}
        />
    );
}