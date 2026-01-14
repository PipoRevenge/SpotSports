import { HourPicker } from "@/src/components/commons/date/hour-picker-component";
import { Button, ButtonText } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { HStack } from "@/src/components/ui/hstack";
import { ChevronDownIcon } from "@/src/components/ui/icon";
import { Input, InputField } from "@/src/components/ui/input";
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from "@/src/components/ui/select";
import { Text } from "@/src/components/ui/text";
import { VStack } from "@/src/components/ui/vstack";
import { useUser } from "@/src/context/user-context";
import {
  DEFAULT_MEETUP_PARTICIPANT_LIMIT,
  MeetupType,
} from "@/src/entities/meetup/model/meetup";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useCreateMeetup } from "../../hooks/use-create-meetup";
import { CreateMeetupFormData, meetupSchema } from "../../utils/validation";
import { DateTimePicker } from "./date-time-picker";
import { TagInput } from "./tag-input";

import { useSpotSports } from "../../hooks/use-spot-sports";

interface CreateMeetupFormProps {
  spotId: string;
}

export const CreateMeetupForm: React.FC<CreateMeetupFormProps> = ({
  spotId,
}) => {
  const router = useRouter();
  const { user } = useUser();
  const { createMeetup, isCreating } = useCreateMeetup();

  // Local state for the form (no extra deps required)
  const [selectedType, setSelectedType] = useState<MeetupType>(
    MeetupType.CASUAL
  );
  const [title, setTitle] = useState<string>("");
  const [sport, setSport] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date(Date.now() + 86400000)); // editable below via ISO input
  const [minParticipants, setMinParticipants] = useState<number>(2);
  const [participantLimit, setParticipantLimit] = useState<number | undefined>(
    undefined
  );
  const [entryFee, setEntryFee] = useState<number | undefined>(undefined);
  const [bracketStyle, setBracketStyle] = useState<
    "SINGLE_ELIMINATION" | "ROUND_ROBIN"
  >("SINGLE_ELIMINATION");
  const [maxTeams, setMaxTeams] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"OPEN" | "CLOSED">("OPEN");
  // Routine specific
  const [routineDays, setRoutineDays] = useState<number[]>([]);
  const [routineTime, setRoutineTime] = useState<string>("18:00");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const spotSportsQuery = useSpotSports(spotId);
  const sportOptions =
    spotSportsQuery.data && spotSportsQuery.data.length > 0
      ? spotSportsQuery.data
      : undefined;

  const buildPayload = (): CreateMeetupFormData => {
    const base: any = {
      title,
      description: description || undefined,
      date,
      spotId,
      organizerId: user?.id || "",
      type: selectedType,
      tags,
    };

    if (selectedType === MeetupType.CASUAL) {
      return {
        ...base,
        type: MeetupType.CASUAL,
        sport: sport,
        minParticipants,
        participantLimit,
        visibility,
      } as unknown as CreateMeetupFormData;
    }

    if (selectedType === MeetupType.TOURNAMENT) {
      return {
        ...base,
        type: MeetupType.TOURNAMENT,
        sport: sport,
        bracketStyle,
        entryFee: entryFee || 0,
        maxTeams: maxTeams || 2,
      } as unknown as CreateMeetupFormData;
    }

    // MATCH fallback
    if (selectedType === MeetupType.MATCH) {
      return {
        ...base,
        type: MeetupType.MATCH,
        sport: sport,
        isRanked: false,
      } as unknown as CreateMeetupFormData;
    }

    // ROUTINE
    return {
      ...base,
      type: MeetupType.ROUTINE,
      daysOfWeek: routineDays,
      time: routineTime,
    } as unknown as CreateMeetupFormData;
  };

  const validate = (payload: unknown) => {
    const result = meetupSchema.safeParse(payload);
    if (!result.success) {
      const zErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] ?? "form";
        zErrors[String(key)] = issue.message;
      }
      setErrors(zErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const onSubmit = async () => {
    if (!user) {
      // prefer redirection to sign in page
      router.push("/auth/sign-in");
      return;
    }

    // Ensure sport is stored as ID. If user somehow selected a name, resolve it to id.
    if (sportOptions && sportOptions.length) {
      const foundById = sportOptions.find((s) => s.id === sport);
      if (!foundById) {
        const foundByName = sportOptions.find(
          (s) => s.name.toLowerCase() === sport.toLowerCase()
        );
        if (foundByName) {
          console.debug(
            "[CreateMeetup] Resolving sport name to id:",
            sport,
            "->",
            foundByName.id
          );
          setSport(foundByName.id);
        }
      }
    }

    console.debug("[CreateMeetup] submitting sport id:", sport);

    const payload = buildPayload();
    if (!validate(payload)) return;

    try {
      // Create Meetup (will create chat automatically)
      createMeetup(
        {
          ...payload,
          organizerId: user.id,
          spotId,
        } as any,
        {
          onSuccess: () => {
            router.back();
          },
          onError: (error) => {
            console.error("Error creating meetup:", error);
            setErrors({
              form: (error as Error)?.message || "Error desconocido",
            });
          },
        }
      );
    } catch (error) {
      console.error("Error creating meetup flow:", error);
      setErrors({ form: (error as Error)?.message || "Error desconocido" });
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <VStack space="md" className="pb-8">
        <Card className="p-4 bg-white rounded-lg shadow-sm">
          <Text className="text-2xl font-bold">Create Meetup</Text>
          <Text className="text-sm text-gray-600 mt-1">
            Schedule a casual play, tournament or match at this spot.
          </Text>
        </Card>

        {/* Type Selector */}
        <View>
          <Text className="mb-1 font-medium text-gray-700">Meetup Type</Text>
          <Select
            selectedValue={selectedType}
            onValueChange={(val) => {
              setSelectedType(val as MeetupType);
            }}
          >
            <SelectTrigger>
              <SelectInput placeholder="Select type" />
              <SelectIcon as={ChevronDownIcon} />
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                <SelectDragIndicatorWrapper>
                  <SelectDragIndicator />
                </SelectDragIndicatorWrapper>
                <SelectItem label="Casual Play" value={MeetupType.CASUAL} />
                <SelectItem label="Tournament" value={MeetupType.TOURNAMENT} />
                <SelectItem label="Match" value={MeetupType.MATCH} />
                <SelectItem label="Routine" value={MeetupType.ROUTINE} />
              </SelectContent>
            </SelectPortal>
          </Select>
        </View>

        {/* Common Fields */}
        <View>
          <Text className="mb-1 font-medium text-gray-700">Title</Text>
          <Input>
            <InputField
              placeholder="e.g. Sunday Morning Football"
              value={title}
              onChangeText={setTitle}
            />
          </Input>
          {errors.title && (
            <Text className="text-red-500 text-xs mt-1">{errors.title}</Text>
          )}
        </View>

        <View>
          <Text className="mb-1 font-medium text-gray-700">Sport</Text>
          {sportOptions && sportOptions.length > 0 ? (
            <Select
              selectedValue={sport}
              onValueChange={(v) => setSport(v as string)}
            >
              <SelectTrigger>
                <SelectInput
                  placeholder="Selecciona un deporte"
                  value={sportOptions.find((s) => s.id === sport)?.name || ""}
                />
                <SelectIcon as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {sportOptions.map((s) => (
                    <SelectItem key={s.id} label={s.name} value={s.id} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          ) : (
            <Select isDisabled>
              <SelectTrigger>
                <SelectInput
                  placeholder={
                    spotSportsQuery.isLoading
                      ? "Cargando deportes..."
                      : "No hay deportes disponibles"
                  }
                />
                <SelectIcon as={ChevronDownIcon} />
              </SelectTrigger>
            </Select>
          )}
          {errors.sport && (
            <Text className="text-red-500 text-xs mt-1">{errors.sport}</Text>
          )}
        </View>

        <Card className="p-4 bg-white rounded-lg shadow-sm">
          <Text className="mb-2 text-lg font-semibold">Details</Text>

          <Text className="mb-1 font-medium text-gray-700">Description</Text>
          <Input>
            <InputField
              placeholder="Details about the meetup..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </Input>
          {errors.description && (
            <Text className="text-red-500 text-xs mt-1">
              {errors.description}
            </Text>
          )}

          <View className="mt-3">
            <DateTimePicker
              value={date}
              onChange={(d) => setDate(d ?? new Date())}
            />
            {errors.date && (
              <Text className="text-red-500 text-xs mt-1">{errors.date}</Text>
            )}
          </View>

          <View className="mt-4">
            <Text className="mb-1 font-medium text-gray-700">Tags</Text>
            <TagInput tags={tags} onChange={setTags} />

            <Text className="mb-1 font-medium text-gray-700 mt-3">
              Visibilidad
            </Text>
            <Select
              selectedValue={visibility}
              onValueChange={(v) => setVisibility(v as any)}
            >
              <SelectTrigger>
                <SelectInput placeholder="Abrir o cerrar" />
                <SelectIcon as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  <SelectItem label="Abierto" value={"OPEN"} />
                  <SelectItem label="Cerrado" value={"CLOSED"} />
                </SelectContent>
              </SelectPortal>
            </Select>
          </View>

          {/* Routine extra fields (if selected type) */}
          {selectedType === MeetupType.ROUTINE ? (
            <View className="mt-4">
              <Text className="mb-1 font-medium text-gray-700">
                Días de la semana
              </Text>
              <HStack className="flex-wrap gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (label, idx) => (
                    <Button
                      key={label}
                      variant={routineDays.includes(idx) ? "solid" : "outline"}
                      onPress={() => {
                        setRoutineDays((prev) =>
                          prev.includes(idx)
                            ? prev.filter((d) => d !== idx)
                            : [...prev, idx]
                        );
                      }}
                    >
                      <ButtonText>{label}</ButtonText>
                    </Button>
                  )
                )}
              </HStack>

              <View className="mt-3">
                <Text className="mb-1 font-medium text-gray-700">Hora</Text>
                <HourPicker value={routineTime} onChange={setRoutineTime} />
                {errors.time && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.time}
                  </Text>
                )}
              </View>
            </View>
          ) : null}
        </Card>

        {/* Specific Fields based on Type */}
        {selectedType === MeetupType.CASUAL && (
          <Card className="p-4 bg-blue-50 rounded-lg">
            <Text className="font-bold text-blue-800 mb-2">
              Casual Settings
            </Text>

            <HStack className="gap-4">
              <View className="flex-1">
                <Text className="mb-1 font-medium text-gray-700">
                  Min Participants
                </Text>
                <Input>
                  <InputField
                    keyboardType="numeric"
                    value={String(minParticipants)}
                    onChangeText={(t) => setMinParticipants(parseInt(t) || 0)}
                  />
                </Input>
                {errors.minParticipants && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.minParticipants}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="mb-1 font-medium text-gray-700">
                  Participant Limit
                </Text>
                <Input>
                  <InputField
                    keyboardType="numeric"
                    value={participantLimit?.toString() ?? ""}
                    onChangeText={(t) =>
                      setParticipantLimit(t ? parseInt(t) : undefined)
                    }
                  />
                </Input>
                <Text className="text-xs text-slate-500 mt-1">
                  Por defecto: {DEFAULT_MEETUP_PARTICIPANT_LIMIT} participantes
                </Text>
                {errors.participantLimit && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.participantLimit}
                  </Text>
                )}
              </View>
            </HStack>
          </Card>
        )}

        {selectedType === MeetupType.TOURNAMENT && (
          <Card className="p-4 bg-yellow-50 rounded-lg">
            <Text className="font-bold text-yellow-800 mb-2">
              Tournament Settings
            </Text>

            <HStack className="gap-4">
              <View className="flex-1">
                <Text className="mb-1 font-medium text-gray-700">
                  Entry Fee ($)
                </Text>
                <Input>
                  <InputField
                    keyboardType="numeric"
                    value={entryFee?.toString() ?? ""}
                    onChangeText={(t) =>
                      setEntryFee(t ? parseInt(t) : undefined)
                    }
                  />
                </Input>
                {errors.entryFee && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.entryFee}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="mb-1 font-medium text-gray-700">
                  Max Teams
                </Text>
                <Input>
                  <InputField
                    keyboardType="numeric"
                    value={maxTeams?.toString() ?? ""}
                    onChangeText={(t) =>
                      setMaxTeams(t ? parseInt(t) : undefined)
                    }
                  />
                </Input>
                {errors.maxTeams && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.maxTeams}
                  </Text>
                )}
              </View>
            </HStack>

            <View className="mt-3">
              <Text className="mb-1 font-medium text-gray-700">
                Bracket Style
              </Text>
              <Select
                selectedValue={bracketStyle}
                onValueChange={(v) => setBracketStyle(v as any)}
              >
                <SelectTrigger>
                  <SelectInput placeholder="Bracket style" />
                  <SelectIcon as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    <SelectItem
                      label="Single Elimination"
                      value="SINGLE_ELIMINATION"
                    />
                    <SelectItem label="Round Robin" value="ROUND_ROBIN" />
                  </SelectContent>
                </SelectPortal>
              </Select>
            </View>
          </Card>
        )}

        {errors.form && (
          <Text className="text-red-500 text-sm mt-2">{errors.form}</Text>
        )}

        <Button onPress={onSubmit} isDisabled={isCreating} className="mt-4">
          <ButtonText>
            {isCreating ? "Creating..." : "Create Meetup"}
          </ButtonText>
        </Button>
      </VStack>
    </ScrollView>
  );
};
