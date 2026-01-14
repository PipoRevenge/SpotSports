import { Button, ButtonText } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Pressable } from "@/src/components/ui/pressable";
import { Text } from "@/src/components/ui/text";
import {
  CasualMeetup,
  DEFAULT_MEETUP_PARTICIPANT_LIMIT,
} from "@/src/entities/meetup/model/meetup";
import { useSportNames } from "@/src/features/sport/hooks/use-sport-names";
import { useAllSportsMap } from "@/src/hooks/use-sports";
import React from "react";
import { View } from "react-native";

interface CasualMeetupCardProps {
  meetup: CasualMeetup;
  onPress: (meetupId: string) => void;
  onJoin?: (meetupId: string) => void;
  onLeave?: (meetupId: string) => void;
  isJoining?: boolean;
  isLeaving?: boolean;
  isParticipant?: boolean;
  isRequested?: boolean;
}

export const CasualMeetupCard: React.FC<CasualMeetupCardProps> = ({
  meetup,
  onPress,
  onJoin,
  onLeave,
  isJoining,
  isLeaving,
  isParticipant,
  isRequested,
}) => {
  const spId = (meetup as any).sport
    ? String((meetup as any).sport)
    : undefined;
  const { getSportName } = useAllSportsMap();
  const { sportNames } = useSportNames(spId ? [spId] : []);
  const sportName = spId
    ? getSportName(spId) ?? sportNames?.[spId] ?? spId
    : "—";

  const formatDateTime = (v: any) => {
    if (!v) return "";
    if (typeof v === "number") return new Date(v).toLocaleString();
    if (typeof v === "string") return new Date(Date.parse(v)).toLocaleString();
    if (v && typeof v.seconds === "number")
      return new Date(v.seconds * 1000).toLocaleString();
    return "";
  };

  return (
    <Pressable onPress={() => onPress(meetup.id)}>
      <Card className="p-4 mb-4 bg-white rounded-lg shadow-sm">
        <View className="flex-col gap-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {(meetup as any).type === "ROUTINE" ? "Routine" : "Casual Play"}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatDateTime(
                (meetup as any).type === "ROUTINE" && (meetup as any).nextDate
                  ? (meetup as any).nextDate
                  : meetup.date
              )}
            </Text>
          </View>

          <Text className="text-lg font-bold text-gray-900">
            {meetup.title}
          </Text>

          <View className="flex-row items-center gap-2 mt-1">
            <View className="bg-gray-100 px-2 py-1 rounded">
              <Text className="text-xs text-gray-700">{sportName}</Text>
            </View>
            <Text className="text-sm text-gray-600">
              {meetup.participantsCount ?? (meetup.participants?.length || 0)} /{" "}
              {meetup.participantLimit ?? DEFAULT_MEETUP_PARTICIPANT_LIMIT}{" "}
              players
            </Text>
          </View>

          {meetup.description && (
            <Text className="text-sm text-gray-500 mt-2" numberOfLines={2}>
              {meetup.description}
            </Text>
          )}

          <View className="flex-row gap-3 mt-4">
            {/* Join / Leave toggle */}
            {isParticipant ? (
              onLeave ? (
                <Button
                  variant="outline"
                  className="flex-1 border-red-500"
                  onPress={() => onLeave?.(meetup.id)}
                  isDisabled={isLeaving}
                >
                  <ButtonText className="text-red-500">
                    {isLeaving ? "Leaving..." : "Leave"}
                  </ButtonText>
                </Button>
              ) : null
            ) : isRequested ? (
              <Button
                variant="outline"
                className="flex-1 border-slate-300"
                isDisabled
              >
                <ButtonText className="text-slate-400">Requested</ButtonText>
              </Button>
            ) : onJoin ? (
              <Button
                variant="outline"
                className="flex-1 border-primary-500"
                onPress={() => onJoin?.(meetup.id)}
                isDisabled={isJoining}
              >
                <ButtonText className="text-primary-500">
                  {isJoining ? "Joining..." : "Join"}
                </ButtonText>
              </Button>
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
};
