import { Profile, ProfileActionType } from "@/src/features/profile";
import { router } from "expo-router";
import React from "react";

export default function MyProfile() {
    const handleNavigateToEdit = () => {
        router.push('/profile/profile-edit');
    };

    const handleNavigateToUser = (userId: string) => {
        router.push(`/profile/${userId}`);
    };

    return (
        <Profile 
            actionType={ProfileActionType.VIEW_OWN}
            showActions={true}
            showStats={true}
            onNavigateToEdit={handleNavigateToEdit}
            onNavigateToUser={handleNavigateToUser}
        />
    );
}
