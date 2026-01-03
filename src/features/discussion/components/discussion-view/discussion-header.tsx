import { MediaCarousel } from '@/src/components/commons/media-carousel';
import { Avatar, AvatarFallbackText, AvatarImage } from '@/src/components/ui/avatar';
import { HStack } from '@/src/components/ui/hstack';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { useAppAlert } from '@/src/context/app-alert-context';
import { useUser } from '@/src/context/user-context';
import { Discussion } from '@/src/entities/discussion/model/discussion';
import { User } from '@/src/entities/user/model/user';
import { useDeleteDiscussion } from '@/src/features/discussion/hooks/use-delete-discussion';
import { useMediaUrls } from '@/src/hooks';
import { formatDate, getInitials } from '@/src/utils/date-utils';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';

interface DiscussionHeaderProps { 
  discussion: Discussion;
  author?: User | null;
}

export const DiscussionHeader: React.FC<DiscussionHeaderProps> = ({ discussion, author }) => {
  const { user } = useUser();
  const router = useRouter();
  const { deleteDiscussion, isDeleting } = useDeleteDiscussion();
  const { showConfirm, showSuccess, showError } = useAppAlert();
  
  const userName = author?.userDetails?.userName || author?.userDetails?.fullName || 'Usuario';
  const profileImageUrl = author?.userDetails?.photoURL;
  const formattedDate = discussion.metadata?.createdAt ? formatDate(discussion.metadata.createdAt) : '';
  const { urls: mediaUrls, loading: mediaLoading } = useMediaUrls(discussion.details.media);
  
  const isOwner = user?.id === discussion.metadata.createdBy;

  const handleDelete = async () => {
    try {
      const confirmed = await showConfirm(
        'Eliminar discusión',
        '¿Estás seguro de que quieres eliminar esta discusión? Esta acción no se puede deshacer.',
        'Eliminar',
        'Cancelar'
      );
      if (!confirmed) return;

      await deleteDiscussion(discussion.id, discussion.details.spotId);
      showSuccess('Discusión eliminada');
      router.back();
    } catch (error) {
      console.error('[DiscussionHeader] delete failed', error);
      showError('No se pudo eliminar la discusión');
    }
  };
  
  return (
    <VStack className="p-3 bg-white rounded-lg">
      <HStack className="justify-between items-start">
        <Text className="text-xl font-bold text-gray-900 flex-1 mr-2">{discussion.details.title}</Text>
        {isOwner && (
          <Pressable onPress={handleDelete} disabled={isDeleting} className="p-1">
            {isDeleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Trash2 size={20} color="#EF4444" />
            )}
          </Pressable>
        )}
      </HStack>
      <HStack className="items-center gap-2 pt-1">
        <Avatar size="xs" className="bg-gray-100 border border-gray-200">
          {profileImageUrl ? (
            <AvatarImage source={{ uri: profileImageUrl }} />
          ) : (
            <AvatarFallbackText className="text-gray-600 text-xs">
              {getInitials(userName)}
            </AvatarFallbackText>
          )}
        </Avatar>
        <Text className="text-sm text-gray-600">Por {userName} — {formattedDate}</Text>
      </HStack>
      {discussion.details.description && (
        <Text className="text-sm text-gray-700 pt-2">{discussion.details.description}</Text>
      )}
      {discussion.details.media && discussion.details.media.length > 0 && (
        <VStack className="pt-3">
          <MediaCarousel media={mediaUrls} loading={mediaLoading} />
        </VStack>
      )}
    </VStack>
  );
};
