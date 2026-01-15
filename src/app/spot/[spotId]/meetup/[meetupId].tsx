import { userRepository } from "@/src/api/repositories";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Badge, BadgeText } from "@/src/components/ui/badge";
import { Button, ButtonText } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Divider } from "@/src/components/ui/divider";
import { HStack } from "@/src/components/ui/hstack";
import { SafeAreaView } from "@/src/components/ui/safe-area-view";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { useAppAlert } from "@/src/context/app-alert-context";
import { useUser } from "@/src/context/user-context";
import { useChatParticipants } from "@/src/features/chat/hooks/use-chat-participants";
import {
  useApproveRequest,
  useRejectRequest,
} from "@/src/features/meetup/hooks/use-approve-reject";
import { useDeleteMeetup } from "@/src/features/meetup/hooks/use-delete-meetup";
import { useJoinMeetup } from "@/src/features/meetup/hooks/use-join-meetup";
import { useLeaveMeetup } from "@/src/features/meetup/hooks/use-leave-meetup";
import { useMeetupDetails } from "@/src/features/meetup/hooks/use-meetup-details";
import { useSpotSports } from "@/src/features/meetup/hooks/use-spot-sports";
import { useSpotDetails } from "@/src/features/spot/hooks/use-spot-details";
import { useProfile } from "@/src/features/user/hooks/use-profile";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeftIcon,
  Calendar,
  Clock,
  MapPin,
  MessageCircleIcon,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

export default function MeetupDetails() {
  const { spotId, meetupId } = useLocalSearchParams<{
    spotId: string;
    meetupId: string;
  }>();
  const router = useRouter();
  const { user } = useUser();
  const { showConfirm, showError, showSuccess } = useAppAlert();

  const {
    data: meetup,
    isLoading,
    error,
    fetchMeetupById,
  } = useMeetupDetails(spotId, meetupId);
  const {
    spot,
    loading: spotLoading,
    error: spotError,
  } = useSpotDetails(spotId);

  // Log para debugging
  React.useEffect(() => {
    console.log(
      "[MeetupDetails] spotId:",
      spotId,
      "spot:",
      spot?.id,
      "loading:",
      spotLoading,
      "error:",
      spotError
    );
  }, [spotId, spot?.id, spotLoading, spotError]);
  const { joinAsync, isJoining } = useJoinMeetup();
  const { leaveAsync, isLeaving } = useLeaveMeetup();
  const { participants, isLoading: isParticipantsLoading } =
    useChatParticipants(meetup?.participants, {
      type: "meetup",
      id: meetupId,
      spotId: spotId,
    });
  const { user: organizer } = useProfile(meetup?.organizerId);
  const { deleteMeetup, isDeleting } = useDeleteMeetup();
  const { approveAsync, isApproving } = useApproveRequest();
  const { rejectAsync, isRejecting } = useRejectRequest();

  // Get sport name
  const { data: sports, isLoading: sportsLoading } = useSpotSports(spotId);
  const sportName = useMemo(() => {
    if (!meetup) return "Deporte";
    if (!sports || sportsLoading) return "Cargando...";

    const sportId = (meetup as any)?.sport;
    if (!sportId) return "Deporte";

    const foundSport = sports.find((s) => s.id === sportId);

    // Debug log
    console.log("[MeetupDetails] Sport lookup:", {
      sportId,
      foundSport: foundSport?.name,
      availableSports: sports.map((s) => ({ id: s.id, name: s.name })),
    });

    return foundSport ? foundSport.name : sportId;
  }, [meetup, sports, sportsLoading]);

  const [requestUsers, setRequestUsers] = React.useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = React.useState(false);

  const isOrganizer = useMemo(
    () => !!user && meetup?.organizerId === user.id,
    [user, meetup]
  );
  const isParticipant = useMemo(
    () =>
      !!user &&
      (meetup?.participants?.includes(user.id) ||
        participants.some((p) => p.id === user.id)),
    [user, meetup, participants]
  );

  const handleJoin = async () => {
    if (!meetupId || !user || !spotId) return;
    try {
      const res = await joinAsync({ spotId, meetupId, userId: user.id });
      const status = (res as any)?.status ?? "joined";
      await fetchMeetupById(spotId, meetupId);
      if (status === "joined" && meetup?.chatId)
        router.push(`/chat/${meetup.chatId}`);
      if (status === "requested") showSuccess("Solicitud enviada");
    } catch (err) {
      showError((err as Error).message || "No se pudo unir");
    }
  };

  const handleLeave = async () => {
    if (!meetupId || !user || !spotId || !meetup) return;
    try {
      await leaveAsync({
        spotId,
        meetupId,
        userId: user.id,
        isOrganizer: false,
      });
      await fetchMeetupById(spotId, meetupId);
    } catch (err) {
      showError((err as Error).message || "No se pudo salir");
    }
  };

  React.useEffect(() => {
    const load = async () => {
      if (!meetup?.joinRequests?.length) {
        setRequestUsers([]);
        return;
      }
      setLoadingRequests(true);
      try {
        const fetched = await Promise.all(
          meetup.joinRequests.map((id: string) =>
            userRepository.getUserById(id)
          )
        );
        setRequestUsers(fetched);
      } catch {
        setRequestUsers([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    load();
  }, [meetup?.joinRequests]);

  const handleApprove = async (requesterId: string) => {
    if (!meetupId || !user || !spotId) return;
    try {
      await approveAsync({
        spotId,
        meetupId,
        requesterId,
        approverId: user.id,
      });
      await fetchMeetupById(spotId, meetupId);
      showSuccess("Usuario añadido al meetup");
    } catch (err) {
      showError((err as Error).message || "No se pudo aprobar");
    }
  };

  const handleReject = async (requesterId: string) => {
    if (!meetupId || !user || !spotId) return;
    try {
      await rejectAsync({ spotId, meetupId, requesterId, approverId: user.id });
      await fetchMeetupById(spotId, meetupId);
      showSuccess("Solicitud rechazada");
    } catch (err) {
      showError((err as Error).message || "No se pudo rechazar");
    }
  };

  const handleDelete = async () => {
    if (!meetupId || !user || !spotId) return;
    const confirmed = await showConfirm(
      "Eliminar meetup",
      "¿Seguro que deseas eliminar este meetup?",
      "Eliminar",
      "Cancelar"
    );
    if (!confirmed) return;
    try {
      await deleteMeetup({ spotId, meetupId, userId: user.id });
      showSuccess("Meetup eliminado");
      router.back();
    } catch (err) {
      showError((err as Error).message || "No se pudo eliminar");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-500">Cargando meetup...</Text>
      </SafeAreaView>
    );
  }

  if (!meetup) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-500">
          {typeof error === "string"
            ? error
            : (error as Error)?.message ?? "Meetup no encontrado"}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-slate-200 flex-row items-center justify-between">
        <Button variant="link" onPress={() => router.back()} className="p-0">
          <ArrowLeftIcon size={24} color="#0f172a" />
        </Button>
        <Text
          className="text-lg font-semibold text-slate-900 flex-1 text-center mx-4"
          numberOfLines={1}
        >
          {meetup.title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 p-4">
        <VStack space="md" className="pb-8">
          {/* Main Info Card */}
          <Card className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <VStack space="md">
              <HStack className="justify-between items-start">
                <VStack>
                  <Text className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-1">
                    {meetup.type}
                  </Text>
                  <Text className="text-2xl font-bold text-slate-900 mb-1">
                    {meetup.title}
                  </Text>
                  <HStack space="sm" className="items-center mt-1">
                    <Badge
                      size="md"
                      variant="solid"
                      action="info"
                      className="rounded-md"
                    >
                      <BadgeText>{sportName}</BadgeText>
                    </Badge>
                    {(meetup as any).visibility && (
                      <Badge
                        size="md"
                        variant="outline"
                        action="muted"
                        className="rounded-md"
                      >
                        <BadgeText>{(meetup as any).visibility}</BadgeText>
                      </Badge>
                    )}
                  </HStack>
                </VStack>
              </HStack>

              <Divider className="my-2" />

              <VStack space="sm">
                <HStack space="md" className="items-center">
                  <Calendar size={18} color="#64748b" />
                  <Text className="text-slate-700 font-medium flex-1">
                    {meetup.date.toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </HStack>
                <HStack space="md" className="items-center">
                  <Clock size={18} color="#64748b" />
                  <Text className="text-slate-700 font-medium flex-1">
                    {meetup.date.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </HStack>
                <HStack space="md" className="items-center">
                  <MapPin size={18} color="#64748b" />
                  <TouchableOpacity
                    onPress={() => router.push(`/spot/${spotId}`)}
                    className="flex-1"
                  >
                    <Text className="text-primary-600 font-medium underline">
                      {spotLoading
                        ? "Cargando spot..."
                        : spot?.details?.name ?? "Ver spot"}
                    </Text>
                  </TouchableOpacity>
                </HStack>
              </VStack>

              {(meetup as any).type === "ROUTINE" && (
                <View className="mt-2 p-3 bg-slate-50 rounded-lg">
                  <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                    Rutina
                  </Text>
                  <Text className="text-sm text-slate-700 mb-1">
                    <Text className="font-semibold">Días:</Text>{" "}
                    {((meetup as any).daysOfWeek || [])
                      .map(
                        (d: number) =>
                          ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d]
                      )
                      .join(", ")}
                  </Text>
                  <Text className="text-sm text-slate-700">
                    <Text className="font-semibold">Hora:</Text>{" "}
                    {(meetup as any).time}
                  </Text>
                  {(meetup as any).nextDate && (
                    <Text className="text-xs text-slate-500 mt-2">
                      Siguiente sesión:{" "}
                      {new Date((meetup as any).nextDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              )}

              {meetup.tags && meetup.tags.length > 0 && (
                <HStack className="flex-wrap gap-2 mt-2">
                  {meetup.tags.map((t: string) => (
                    <View key={t} className="px-2 py-1 bg-slate-100 rounded-md">
                      <Text className="text-xs text-slate-600">#{t}</Text>
                    </View>
                  ))}
                </HStack>
              )}
            </VStack>
          </Card>

          {/* Description Card */}
          {meetup.description ? (
            <Card className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
              <Text className="text-lg font-semibold text-slate-900 mb-2">
                Descripción
              </Text>
              <Text className="text-slate-600 leading-relaxed">
                {meetup.description}
              </Text>
            </Card>
          ) : null}

          {/* Organizer & Actions */}
          <Card className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <Text className="text-lg font-semibold text-slate-900 mb-3">
              Organizado por
            </Text>
            <HStack className="items-center justify-between">
              <HStack space="md" className="items-center">
                <Avatar size="md">
                  {organizer?.userDetails?.photoURL ? (
                    <AvatarImage
                      source={{ uri: organizer.userDetails.photoURL }}
                    />
                  ) : null}
                  <AvatarFallbackText>
                    {organizer?.userDetails?.userName || "User"}
                  </AvatarFallbackText>
                </Avatar>
                <VStack>
                  <Text className="font-semibold text-slate-900">
                    {organizer?.userDetails?.fullName ||
                      organizer?.userDetails?.userName ||
                      "Usuario"}
                  </Text>
                  <Text className="text-xs text-slate-500">Organizador</Text>
                </VStack>
              </HStack>

              {meetup.chatId && (
                <Button
                  size="sm"
                  variant="outline"
                  action="primary"
                  onPress={() => router.push(`/chat/${meetup.chatId}`)}
                >
                  <ButtonText>Chat</ButtonText>
                  <MessageCircleIcon
                    size={16}
                    className="ml-2 text-primary-600"
                  />
                </Button>
              )}
            </HStack>
          </Card>

          {/* Participants */}
          <Card className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <HStack className="justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-slate-900">
                Participantes
              </Text>
              <Badge variant="solid" action="success" className="rounded-full">
                <BadgeText>
                  {meetup.participantsCount ?? 0} /{" "}
                  {(meetup as any).participantLimit || "∞"}
                </BadgeText>
              </Badge>
            </HStack>

            {isParticipantsLoading ? (
              <Text className="text-slate-500 text-center py-4">
                Cargando participantes...
              </Text>
            ) : (
              <VStack space="sm">
                {participants.map((p) => (
                  <HStack
                    key={p.id}
                    className="items-center justify-between py-2 border-b border-slate-50 last:border-0"
                  >
                    <HStack space="md" className="items-center">
                      <Avatar size="sm">
                        {p.userDetails?.photoURL ? (
                          <AvatarImage
                            source={{ uri: p.userDetails.photoURL }}
                          />
                        ) : null}
                        <AvatarFallbackText>
                          {p.userDetails?.userName || "U"}
                        </AvatarFallbackText>
                      </Avatar>
                      <Text className="text-slate-700 font-medium">
                        {p.userDetails?.fullName || p.userDetails?.userName}
                      </Text>
                    </HStack>
                    {p.id === meetup.organizerId && (
                      <Badge size="sm" variant="outline" action="info">
                        <BadgeText>Host</BadgeText>
                      </Badge>
                    )}
                  </HStack>
                ))}
                {participants.length === 0 && (
                  <Text className="text-slate-500 text-center py-2">
                    Aún no hay participantes
                  </Text>
                )}
              </VStack>
            )}

            {/* Join Requests (Organizer Only) */}
            {isOrganizer &&
              meetup.joinRequests &&
              meetup.joinRequests.length > 0 && (
                <View className="mt-6 pt-4 border-t border-slate-100">
                  <Text className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
                    Solicitudes pendientes ({meetup.joinRequests.length})
                  </Text>
                  {loadingRequests ? (
                    <Text className="text-slate-500">
                      Cargando solicitudes...
                    </Text>
                  ) : (
                    <VStack space="md">
                      {requestUsers.map((r) => (
                        <HStack
                          key={r.id}
                          className="items-center justify-between bg-slate-50 p-3 rounded-lg"
                        >
                          <HStack space="sm" className="items-center flex-1">
                            <Avatar size="sm">
                              {r.userDetails?.photoURL ? (
                                <AvatarImage
                                  source={{ uri: r.userDetails.photoURL }}
                                />
                              ) : null}
                              <AvatarFallbackText>
                                {r.userDetails?.userName}
                              </AvatarFallbackText>
                            </Avatar>
                            <Text
                              className="text-slate-700 font-medium flex-1"
                              numberOfLines={1}
                            >
                              {r.userDetails?.fullName ||
                                r.userDetails?.userName}
                            </Text>
                          </HStack>
                          <HStack space="xs">
                            <Button
                              size="xs"
                              action="positive"
                              onPress={() => handleApprove(r.id)}
                              isDisabled={isApproving}
                            >
                              <ButtonText>Aceptar</ButtonText>
                            </Button>
                            <Button
                              size="xs"
                              action="negative"
                              variant="outline"
                              onPress={() => handleReject(r.id)}
                              isDisabled={isRejecting}
                            >
                              <ButtonText>Rechazar</ButtonText>
                            </Button>
                          </HStack>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </View>
              )}
          </Card>

          {/* Main Actions */}
          <View className="mt-2 mb-8">
            {!user ? (
              <Button
                size="lg"
                onPress={() => router.push("/auth/sign-in")}
                className="w-full"
              >
                <ButtonText>Iniciar sesión para unirme</ButtonText>
              </Button>
            ) : isOrganizer ? (
              <VStack space="md">
                <Button
                  size="lg"
                  variant="outline"
                  action="primary"
                  onPress={() =>
                    router.push(`/spot/${spotId}/meetup/${meetupId}/edit`)
                  }
                  className="w-full border-primary-500"
                >
                  <ButtonText className="text-primary-600">
                    Editar Meetup
                  </ButtonText>
                </Button>
                <Button
                  size="lg"
                  variant="solid"
                  action="negative"
                  onPress={handleDelete}
                  isDisabled={isDeleting}
                  className="w-full"
                >
                  <ButtonText>
                    {isDeleting ? "Eliminando..." : "Eliminar Meetup"}
                  </ButtonText>
                </Button>
              </VStack>
            ) : isParticipant ? (
              <Button
                size="lg"
                variant="outline"
                action="negative"
                onPress={handleLeave}
                isDisabled={isLeaving}
                className="w-full border-red-500"
              >
                <ButtonText className="text-red-600">
                  {isLeaving ? "Saliendo..." : "Salir del Meetup"}
                </ButtonText>
              </Button>
            ) : (
              <Button
                size="lg"
                action="primary"
                onPress={handleJoin}
                isDisabled={isJoining}
                className="w-full bg-primary-600"
              >
                <ButtonText className="font-bold">
                  {isJoining ? "Uniéndose..." : "Unirme al Meetup"}
                </ButtonText>
              </Button>
            )}
          </View>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
