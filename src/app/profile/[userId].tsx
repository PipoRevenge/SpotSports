import { Profile, ProfileActionType } from "@/src/features/profile";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";

export default function UserProfile() {
    const { userId } = useLocalSearchParams<{ userId: string }>();

    const handleNavigateToUser = (targetUserId: string) => {
        if (targetUserId !== userId) {
            router.push(`/profile/${targetUserId}`);
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <Profile 
            userId={userId}
            actionType={ProfileActionType.VIEW_OTHER}
            showActions={true}
            showStats={true}
            onNavigateToUser={handleNavigateToUser}
            onBack={handleBack}
        />
    );
}