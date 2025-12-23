import { MeetupFilters, MeetupTimeOfDay } from '@/src/api/repositories/interfaces/i-meetup-repository';

import { useAppAlert } from '@/src/context/app-alert-context';
import { useUser } from '@/src/context/user-context';
import { Meetup, MeetupType, MeetupVisibility } from '@/src/entities/meetup';
import { useSportNames } from '@/src/features/sport/hooks/use-sport-names';
import { useAllSportsMap } from '@/src/hooks/use-sports';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useJoinMeetup } from '../../hooks/use-join-meetup';
import { useLeaveMeetup } from '../../hooks/use-leave-meetup';
import { useMeetupDetails } from '../../hooks/use-meetup-details';
import { useMeetups } from '../../hooks/use-meetups';
import { useSpotSports } from '../../hooks/use-spot-sports';
import { MeetupCardRenderer } from '../card/meetup-card-renderer';
import { MeetupFiltersModal } from './meetup-filters-modal';

interface MeetupListProps {
  spotId: string;
  /** Optional registration for external controls: open modal + report active filters */
  onRegisterFiltersControls?: (controls: { open: () => void; getActiveFilters: () => number }) => void;
}

export const MeetupList: React.FC<MeetupListProps> = ({ spotId, onRegisterFiltersControls }) => {
  const router = useRouter();
  const { user } = useUser();
  const { showConfirm } = useAppAlert();
  const { joinAsync } = useJoinMeetup();
  const { leaveAsync } = useLeaveMeetup();
  const { fetchMeetupById } = useMeetupDetails();
  const { data: spotSports } = useSpotSports(spotId);
  const { getSportName } = useAllSportsMap();

  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState<MeetupType | undefined>(undefined);
  const [visibilityFilter, setVisibilityFilter] = React.useState<MeetupVisibility | undefined>(undefined);
  const [selectedSports, setSelectedSports] = React.useState<string[]>([]);
  const [dateFrom, setDateFrom] = React.useState<Date | null>(null);
  const [dateTo, setDateTo] = React.useState<Date | null>(null);
  const [timeOfDay, setTimeOfDay] = React.useState<MeetupTimeOfDay | undefined>(undefined);

  const filters = React.useMemo<MeetupFilters | undefined>(() => {
    const f = {
      type: typeFilter ?? undefined,
      visibility: visibilityFilter ?? undefined,
      sports: selectedSports.length ? selectedSports : undefined,
      dateFrom: dateFrom ?? undefined,
      dateTo: dateTo ?? undefined,
      timeOfDay: timeOfDay ?? undefined,
    };
    console.debug('[MeetupList] Applying filters:', f);
    return f;
  }, [dateFrom, dateTo, selectedSports, timeOfDay, typeFilter, visibilityFilter]);

  const { data: meetups, isLoading, error } = useMeetups(spotId, filters);

  const [joiningId, setJoiningId] = React.useState<string | null>(null);
  const [leavingId, setLeavingId] = React.useState<string | null>(null);



  const activeFilters = React.useMemo(() => {
    let count = 0;
    if (typeFilter !== undefined) count += 1;
    if (visibilityFilter !== undefined) count += 1;
    if (selectedSports.length) count += 1;
    if (dateFrom || dateTo) count += 1;
    if (timeOfDay !== undefined) count += 1;
    return count;
  }, [dateFrom, dateTo, selectedSports.length, timeOfDay, typeFilter, visibilityFilter]);

  const handlePress = (meetupId: string) => {
    // Navigate to meetup details
    router.push(`/spot/${spotId}/meetup/${meetupId}`);
  };

  // Keep the activeFilters in a ref so we can expose a stable controls object
  const activeFiltersRef = React.useRef<number>(activeFilters);
  React.useEffect(() => {
    activeFiltersRef.current = activeFilters;
  }, [activeFilters]);

  const controls = React.useMemo(() => ({
    open: () => setFiltersOpen(true),
    getActiveFilters: () => activeFiltersRef.current,
  }), []);

  // Expose controls for parent (only when onRegisterFiltersControls reference changes)
  React.useEffect(() => {
    if (typeof onRegisterFiltersControls === 'function') {
      onRegisterFiltersControls(controls);
    }
  }, [onRegisterFiltersControls, controls]);

  const handleJoin = async (meetupId: string) => {
    if (!user?.id) return router.push('/auth/sign-in');

    setJoiningId(meetupId);
    try {
      await joinAsync({ spotId, meetupId, userId: user.id });

      // Fetch meetup to get the chatId and navigate to chat if available (via hook helper)
      const meetup = await fetchMeetupById(spotId, meetupId);
      if (meetup?.chatId) {
        router.push(`/chat/${meetup.chatId}`);
      }
    } catch (err) {
      console.error('Failed to join meetup', err);
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeave = (meetup: Meetup, isOrganizer: boolean) => async (_?: string) => {
    if (!user?.id) return router.push('/auth/sign-in');

    const confirmed = await showConfirm(
      isOrganizer ? 'Salir y eliminar meetup' : 'Salir del meetup',
      isOrganizer
        ? 'Eres el organizador. Al salir se eliminará el meetup y su chat asociados. ¿Deseas continuar?'
        : '¿Seguro que quieres salir del meetup?',
      isOrganizer ? 'Eliminar y salir' : 'Salir',
      'Cancelar'
    );

    if (!confirmed) return;

    setLeavingId(meetup.id);
    try {
      await leaveAsync({ spotId, meetupId: meetup.id, userId: user.id });
      await fetchMeetupById(spotId, meetup.id);
    } catch (err) {
      console.error('Failed to leave meetup', err);
    } finally {
      setLeavingId(null);
    }
  };

  // Compute unresolved sport ids (may be empty); call hook unconditionally
  const unresolvedSportIds = new Set<string>();
  if (meetups && meetups.length > 0) {
    meetups.forEach((meetup) => {
      const sp = (meetup as any).sport;
      if (!sp) return;
      const globalName = getSportName?.(String(sp));
      const spotSpecific = spotSports && spotSports.find(s => s.id === sp || s.name === sp);
      if (!spotSpecific && !globalName && typeof sp === 'string') unresolvedSportIds.add(sp);
    });
  }

  const { sportNames } = useSportNames(Array.from(unresolvedSportIds));

  let content: React.ReactNode = null;

  if (isLoading) {
    content = (
      <View className="p-4">
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  } else if (error) {
    content = (
      <View className="p-4">
        <Text className="text-red-500">Error loading meetups</Text>
      </View>
    );
  } else if (!meetups || meetups.length === 0) {
    content = (
      <View className="p-8 items-center justify-center bg-gray-50 rounded-lg">
        <Text className="text-gray-500 text-center">
          No meetups scheduled yet. Be the first to organize one!
        </Text>
      </View>
    );
  } else {
    content = (
      <View className="flex-col gap-4">
        {meetups.map((meetup: Meetup) => {
          const isParticipant = !!user?.id && !!meetup.participants?.includes(user.id);
          const isOrganizer = !!user?.id && meetup.organizerId === user.id;
          const isRequested = !!user?.id && !!meetup.joinRequests?.includes(user.id);

          // Resolve sport name for display: meetups may store sport as id or name
          const sportName = ((): string | undefined => {
            const sp = (meetup as any).sport;
            if (!sp) return undefined;

            // 1) Try spot-specific sports
            if (spotSports) {
              const found = spotSports.find(s => s.id === sp || s.name === sp);
              if (found) return found.name;
            }

            // 2) Fallback to global sports map by id
            const globalName = getSportName?.(String(sp));
            if (globalName) return globalName;

            // 3) Try sportNames (fetched individually)
            const singleName = sportNames?.[String(sp)];
            if (singleName) return singleName;

            // 4) Last fallback: if it's a string, return it (could already be a name)
            return typeof sp === 'string' ? sp : undefined;
          })();

          const meetupForDisplay = { ...meetup } as any;
          if (sportName) meetupForDisplay.sport = sportName;

          return (
            <MeetupCardRenderer
              key={meetup.id}
              meetup={meetupForDisplay}
              onPress={handlePress}
              onJoin={handleJoin}
              onLeave={handleLeave(meetup, isOrganizer)}
              isJoining={joiningId === meetup.id}
              isLeaving={leavingId === meetup.id}
              isParticipant={isParticipant}
              isRequested={isRequested}
            />
          );
        })}
      </View>
    );
  }

  return (
    <View className="flex-col gap-4">
    

      {content}

      <MeetupFiltersModal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={(applied) => {
          // apply selected filters from modal
          setTypeFilter(applied.type ?? undefined);
          setVisibilityFilter(applied.visibility ?? undefined);
          setSelectedSports(applied.sports ?? []);
          setDateFrom(applied.dateFrom ?? null);
          setDateTo(applied.dateTo ?? null);
          setTimeOfDay(applied.timeOfDay ?? undefined);
        }}
        typeFilter={typeFilter}
        visibilityFilter={visibilityFilter}
        selectedSports={selectedSports}
        spotSports={spotSports}
        dateFrom={dateFrom}
        dateTo={dateTo}
        timeOfDay={timeOfDay}
      />
    </View>
  );
};
