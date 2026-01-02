import { Avatar, AvatarFallbackText, AvatarImage } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import { HStack } from '@/src/components/ui/hstack';
import { Icon } from '@/src/components/ui/icon';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { useAppAlert } from '@/src/context/app-alert-context';
import { useUser } from '@/src/context/user-context';
import { useSportNames } from '@/src/features/sport/hooks/use-sport-names';
import { useSpotData } from '@/src/features/spot/hooks/use-spot-data';
import { useMediaUrl } from '@/src/hooks/use-media-urls';
import { useAllSportsMap } from '@/src/hooks/use-sports';
import { getInitials } from '@/src/utils/date-utils';
import { Calendar, ExternalLink, MapPin, Trash2, UserMinus, Users } from 'lucide-react-native';
import React from 'react';

export type ProfileMeetupCardProps = {
  meetup: any;
  isOwn?: boolean;
  saved?: boolean;
  onOpen?: () => void;
  onRemove?: () => Promise<void> | void;
  onLeave?: () => Promise<void> | void;
  isLeaving?: boolean;
};

export const ProfileMeetupCard: React.FC<ProfileMeetupCardProps> = ({ meetup, isOwn = false, saved = false, onOpen, onRemove, onLeave, isLeaving }) => {
  const { user: currentUser } = useUser();
  const { showConfirm } = useAppAlert();
  const isParticipant = Array.isArray(meetup?.participants) && currentUser?.id ? meetup.participants.includes(currentUser.id) : false;
  const isOrganizer = meetup?.organizerId === currentUser?.id;
  const { getSportName } = useAllSportsMap();
  const { spot } = useSpotData(meetup?.spotId);

  const participantsCount = typeof meetup?.participantsCount === 'number' 
    ? meetup.participantsCount 
    : (Array.isArray(meetup?.participants) ? meetup.participants.length : 0);

  const toDate = (v: any): Date | undefined => {
    if (!v) return undefined;
    if (v instanceof Date) return v;
    if (typeof v === 'number') return new Date(v);
    if (typeof v === 'string') {
      const n = Date.parse(v);
      return isNaN(n) ? undefined : new Date(n);
    }
    if (v && typeof v.seconds === 'number') return new Date(v.seconds * 1000);
    return undefined;
  };

  const d = toDate(meetup?.date ?? meetup?.nextDate);
  // Format: "Lun, 02 Ene"
  const dateText = d ? d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' }) : '';
  // Format: "14:30"
  const timeText = d ? d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';

  const sportId = meetup?.sport ? String(meetup.sport) : undefined;
  const { sportNames } = useSportNames(sportId ? [sportId] : []);
  const sportName = sportId ? (getSportName(sportId) ?? sportNames?.[sportId] ?? sportId) : undefined;
  const firstMedia = (spot?.details?.media && spot.details.media.length > 0) ? spot.details.media[0] : (meetup?.media && meetup.media.length > 0 ? meetup.media[0] : undefined);
  const { url: avatarUrl } = useMediaUrl(firstMedia);

  const handleLeave = async () => {
    if (!onLeave) return;
    
    if (isOrganizer) {
      const confirmed = await showConfirm(
        'Abandonar meetup',
        '⚠️ Eres el organizador de este meetup. Si lo abandonas, el meetup será eliminado permanentemente y todos los participantes serán desvinculados. ¿Estás seguro?',
        'Eliminar meetup',
        'Cancelar'
      );
      if (confirmed) {
        onLeave();
      }
    } else {
      const confirmed = await showConfirm(
        'Abandonar meetup',
        '¿Estás seguro de que quieres abandonar este meetup?',
        'Abandonar',
        'Cancelar'
      );
      if (confirmed) {
        onLeave();
      }
    }
  };

  return (
    <Pressable
      onPress={onOpen}
      className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      <VStack className="p-4 gap-3">
        {/* Header: Avatar, Title, Sport */}
        <HStack className="justify-between items-start gap-3">
          <HStack className="gap-3 flex-1">
            <Avatar size="md" className="bg-gray-100 border border-gray-200">
              {avatarUrl ? (
                <AvatarImage source={{ uri: avatarUrl }} />
              ) : (
                <AvatarFallbackText className="text-blue-700 font-semibold">
                  {getInitials(spot?.details?.name ?? meetup?.spotName)}
                </AvatarFallbackText>
              )}
            </Avatar>

            <VStack className="flex-1 gap-1">
              <Text className="text-base font-bold text-gray-900 leading-tight" numberOfLines={1}>
                {meetup?.title || 'Meetup'}
              </Text>
              <HStack className="items-center gap-1">
                <Icon as={MapPin} size={12} color="#6b7280" />
                <Text className="text-xs text-gray-500 font-medium" numberOfLines={1}>
                  {spot?.details?.name ?? meetup?.spotName ?? '—'}
                </Text>
              </HStack>
            </VStack>
          </HStack>

          {sportName && (
            <VStack className="bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              <Text className="text-xs font-medium text-blue-700">{sportName}</Text>
            </VStack>
          )}
        </HStack>

        {/* Info Grid: Date, Participants */}
        <HStack className="items-center gap-3 flex-wrap">
          <HStack className="items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100">
            <Icon as={Calendar} size={14} color="#6b7280" />
            <Text className="text-xs text-gray-600 font-medium">
              {dateText} {timeText ? `• ${timeText}` : ''}
            </Text>
          </HStack>

          {typeof participantsCount === 'number' && (
            <HStack className="items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100">
              <Icon as={Users} size={14} color="#6b7280" />
              <Text className="text-xs text-gray-600 font-medium">
                {participantsCount}
              </Text>
            </HStack>
          )}
        </HStack>

        {/* Actions Footer */}
        <HStack className="pt-3 mt-1 border-t border-gray-100 justify-end gap-2">
          {isOwn && isParticipant && (
            <Button
              size="sm"
              variant="outline"
              onPress={handleLeave}
              className="border-red-200 h-9 px-3"
            >
              <HStack className="gap-2 items-center">
                <Icon as={UserMinus} size={14} color="#dc2626" />
                <Text className="text-xs font-medium text-red-600">Abandonar</Text>
              </HStack>
            </Button>
          )}

          {isOwn && saved && (
            <Button
              size="sm"
              variant="outline"
              onPress={onRemove}
              className="border-gray-200 h-9 w-9 p-0 items-center justify-center"
            >
              <Icon as={Trash2} size={14} color="#6b7280" />
            </Button>
          )}

          <Button size="sm" onPress={onOpen} className="bg-gray-900 h-9 px-4">
            <HStack className="gap-2 items-center">
              <Text className="text-xs font-medium text-white">Ver detalles</Text>
              <Icon as={ExternalLink} size={14} color="white" />
            </HStack>
          </Button>
        </HStack>
      </VStack>
    </Pressable>
  );
};

export default ProfileMeetupCard;
