import { Meetup, MeetupType } from '@/src/entities/meetup';
import React from 'react';
import { Text, View } from 'react-native';
import { CasualMeetupCard } from './casual-meetup-card';
import { TournamentMeetupCard } from './tournament-meetup-card';

interface MeetupCardRendererProps {
  meetup: Meetup;
  onPress: (meetupId: string) => void;
  onJoin?: (meetupId: string) => void;
  onLeave?: (meetupId: string) => void;
  isJoining?: boolean;
  isLeaving?: boolean;
  isParticipant?: boolean;
  isRequested?: boolean;
}

/**
 * Factory component that renders the correct card based on the meetup type.
 * This avoids if/else chains in the parent list component.
 */
export const MeetupCardRenderer: React.FC<MeetupCardRendererProps> = ({ meetup, onPress, onJoin, onLeave, isJoining, isLeaving, isParticipant }) => {
  switch (meetup.type) {
    case MeetupType.CASUAL:
      return <CasualMeetupCard meetup={meetup as any} onPress={onPress} onJoin={onJoin} onLeave={onLeave} isJoining={isJoining} isLeaving={isLeaving} isParticipant={isParticipant} />;

    case MeetupType.ROUTINE:
      return <CasualMeetupCard meetup={meetup as any} onPress={onPress} onJoin={onJoin} onLeave={onLeave} isJoining={isJoining} isLeaving={isLeaving} isParticipant={isParticipant} />;
    
    case MeetupType.TOURNAMENT:
      return <TournamentMeetupCard meetup={meetup as any} onPress={onPress} />;
      
    case MeetupType.MATCH:
      // Placeholder for Match type
      return (
        <View className="p-4 bg-gray-100 rounded mb-4">
          <Text>Match: {meetup.title}</Text>
        </View>
      );

    default:
      // Exhaustive check fallback
      const _exhaustiveCheck: never = meetup;
      return null;
  }
};
