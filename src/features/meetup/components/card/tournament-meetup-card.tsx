import { Card } from '@/src/components/ui/card';
import { Pressable } from '@/src/components/ui/pressable';
import { Text } from '@/src/components/ui/text';
import { TournamentMeetup } from '@/src/entities/meetup/model/meetup';
import { useSportNames } from '@/src/features/sport/hooks/use-sport-names';
import { useAllSportsMap } from '@/src/hooks/use-sports';
import React from 'react';
import { View } from 'react-native';

interface TournamentMeetupCardProps {
  meetup: TournamentMeetup;
  onPress: (meetupId: string) => void;
}

export const TournamentMeetupCard: React.FC<TournamentMeetupCardProps> = ({ meetup, onPress }) => {
  const spId = (meetup as any).sport ? String((meetup as any).sport) : undefined;
  const { getSportName } = useAllSportsMap();
  const { sportNames } = useSportNames(spId ? [spId] : []);
  const sportName = spId ? (getSportName(spId) ?? sportNames?.[spId] ?? spId) : '—';

  return (
    <Pressable onPress={() => onPress(meetup.id)}>
      <Card className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <View className="flex-col gap-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Tournament 🏆</Text>
          <Text className="text-xs text-yellow-700">{((meetup as any).type === 'ROUTINE' && (meetup as any).nextDate) ? new Date((meetup as any).nextDate).toLocaleString() : new Date(meetup.date).toLocaleString()}</Text>
        </View>
        
        <Text className="text-lg font-bold text-gray-900">{meetup.title}</Text>
        
        <View className="flex-row flex-wrap gap-2 mt-1">
          <View className="bg-white px-2 py-1 rounded border border-yellow-100">
            <Text className="text-xs text-gray-700">{sportName}</Text>
          </View>
          <View className="bg-white px-2 py-1 rounded border border-yellow-100">
            <Text className="text-xs text-gray-700">{meetup.bracketStyle.replace('_', ' ')}</Text>
          </View>
        </View>

        <View className="mt-2 p-2 bg-white/50 rounded">
           <Text className="text-sm font-semibold text-gray-800">
             Entry Fee: ${meetup.entryFee}
           </Text>
           <Text className="text-sm text-gray-600">
             Max Teams: {meetup.maxTeams}
           </Text>
        </View>

      </View>
      </Card>
    </Pressable>
  );
};
