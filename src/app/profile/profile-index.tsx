import { VStack } from "@/src/components/ui/vstack";
import ProfileEditForm from "@/src/features/user/components/profile/profile-edit-form";
import { exampleUser } from "@/src/types/user";
import React from "react";

export default function Profile() {

    return (
        <VStack className="w-full flex-1 bg-white px-4 pt-6">
            
            <ProfileEditForm user={exampleUser} />
        </VStack>
    );
}
           
