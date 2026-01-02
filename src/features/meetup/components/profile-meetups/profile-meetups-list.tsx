import { HStack } from '@/src/components/ui/hstack';
import { ChevronDownIcon } from '@/src/components/ui/icon';
import { Select, SelectContent, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from '@/src/components/ui/select';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import React, { useState } from 'react';

import { useUser } from '@/src/context/user-context';
import { ProfileMeetupCard } from '@/src/features/meetup/components/profile-meetups/profile-meetup-card';
import { useLeaveMeetup } from '@/src/features/meetup/hooks/use-leave-meetup';
import { useMeetupsByUser } from '@/src/features/meetup/hooks/use-meetups-by-user';
import { useUserMeetups } from '@/src/features/meetup/hooks/use-user-meetups';
import { useRouter } from 'expo-router';

export const ProfileMeetupsList: React.FC<{ userId?: string }> = ({ userId }) => {
  const { user: currentUser } = useUser();
  const isOwn = currentUser?.id === userId;
  const router = useRouter();

  // Local storage for current user
  const local = useUserMeetups(userId);

  // Server-side fetch for profile user's actual meetups (participant/organizer)
  const server = useMeetupsByUser(userId);

  const loading = isOwn ? local.loading : server.isLoading;

  // Debug: inspect what's being returned by local storage and server
  console.debug('[ProfileMeetupsList] userId=', userId, 'currentUser=', currentUser?.id, 'isOwn=', isOwn, 'localCount=', local.items?.length, 'serverDataType=', typeof server.data, 'serverCount=', server.data?.length, 'serverLoading=', server.isLoading, 'serverError=', server.error);

  // Normalize to array in case server returns object-like structure
  const serverItems: any[] = Array.isArray(server.data) ? server.data : (server.data ? Object.values(server.data) : []);
  const localItems: any[] = Array.isArray(local.items) ? local.items : (local.items ? Object.values(local.items) : []);

  // Combine when viewing own profile so the user sees both saved and server-side meetups
  const combinedMap = new Map<string, any>();
  // add server items first
  for (const s of serverItems) {
    combinedMap.set(s.id, { ...s, _saved: localItems.some(l => l.id === s.id) });
  }
  // merge local items and mark as saved
  for (const l of localItems) {
    const existing = combinedMap.get(l.id);
    combinedMap.set(l.id, { ...(existing || {}), ...l, _saved: true });
  }

  const combined = Array.from(combinedMap.values());

  // date parser used for sorting
  const toDate = (v: any): Date | undefined => {
    if (!v) return undefined;
    if (typeof v === 'number') return new Date(v);
    if (typeof v === 'string') {
      const n = Date.parse(v);
      return isNaN(n) ? undefined : new Date(n);
    }
    if (v && typeof v.seconds === 'number') return new Date(v.seconds * 1000);
    return undefined;
  };

  const { leaveAsync, isLeaving } = useLeaveMeetup();

  const [sortOrder, setSortOrder] = useState<'date-asc' | 'date-desc'>('date-asc');
  const sortOptions = [
    { key: 'date-asc', label: 'Fecha — Próximo primero' },
    { key: 'date-desc', label: 'Fecha — Más lejanos primero' },
  ];

  let items: any[] = isOwn ? combined : serverItems;

  // If viewing own profile, order the meetups the user has JOINED by their date (soonest first)
  const direction = sortOrder === 'date-asc' ? 1 : -1;

  if (isOwn && currentUser?.id) {
    const userId = currentUser.id;
    const joined = items
      .filter(m => Array.isArray(m?.participants) && m.participants.includes(userId))
      .sort((a, b) => {
        const da = toDate(a?.date ?? a?.nextDate)?.getTime() ?? 0;
        const db = toDate(b?.date ?? b?.nextDate)?.getTime() ?? 0;
        return (da - db) * direction;
      });
    const others = items
      .filter(m => !Array.isArray(m?.participants) || !m.participants.includes(userId))
      .sort((a, b) => {
        const da = toDate(a?.date ?? a?.nextDate)?.getTime() ?? 0;
        const db = toDate(b?.date ?? b?.nextDate)?.getTime() ?? 0;
        return (da - db) * direction;
      });
    items = [...joined, ...others];
  } else {
    // Not own profile: order all meetups by date according to chosen direction
    items = items.sort((a, b) => {
      const da = toDate(a?.date ?? a?.nextDate)?.getTime() ?? 0;
      const db = toDate(b?.date ?? b?.nextDate)?.getTime() ?? 0;
      return (da - db) * direction;
    });
  }

  console.debug('[ProfileMeetupsList] combinedCount=', combined.length, 'serverCount=', serverItems.length, 'localCount=', localItems.length);

  if (loading) return (
    <VStack className="p-4">
      <Text>Cargando meetups...</Text>
    </VStack>
  );

  if (!items || items.length === 0) return (
    <VStack className="p-4 items-center">
      <Text className="text-gray-600">{isOwn ? 'No tienes meetups guardados aún.' : 'No se encontraron meetups para este usuario.'}</Text>
    </VStack>
  );

  return (
    <VStack className="p-2 gap-2">
      <HStack className="justify-between items-center px-2">
        <Text className="text-sm font-semibold">{isOwn ? 'Meetups guardados' : 'Meetups donde participa'}</Text>

        <Select selectedValue={sortOrder} onValueChange={(v) => setSortOrder(v as 'date-asc' | 'date-desc')}>
          <SelectTrigger variant="outline" size="sm" className="min-w-[180px]">
            <SelectInput placeholder="Ordenar" value={sortOptions.find(o => o.key === sortOrder)?.label} />
            <SelectIcon as={ChevronDownIcon} />
          </SelectTrigger>
          <SelectPortal>
            <SelectContent>
              {sortOptions.map((o) => <SelectItem key={o.key} label={o.label} value={o.key} />)}
            </SelectContent>
          </SelectPortal>
        </Select>
      </HStack> 

      {items.map((m: any) => (
        <ProfileMeetupCard
          key={m.id}
          meetup={m}
          isOwn={isOwn}
          saved={!!m._saved}
          onOpen={() => router.push(`/spot/${m.spotId}/meetup/${m.id}`)}
          onRemove={async () => { await local.remove(m.id); await local.reload(); }}
          onLeave={async () => { 
            try { 
              if (!currentUser?.id) return; 
              console.debug('[ProfileMeetupsList] leaving meetup', m.id, 'user=', currentUser.id); 
              const isOrganizer = m.organizerId === currentUser.id;
              await leaveAsync({ spotId: m.spotId, meetupId: m.id, userId: currentUser.id, isOrganizer }); 
              await local.reload(); 
            } catch (e) { 
              console.debug('[ProfileMeetupsList] leave error', e); 
            } 
          }}
          isLeaving={isLeaving}
        />
      ))}
    </VStack>
  );
};

export default ProfileMeetupsList;
