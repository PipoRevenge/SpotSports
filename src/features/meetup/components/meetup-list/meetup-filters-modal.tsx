import { MeetupTimeOfDay } from "@/src/api/repositories/interfaces/i-meetup-repository";
import DatePickerComponent from "@/src/components/commons/date/date-picker-component";
import { Button, ButtonText } from "@/src/components/ui/button";
import { ChevronDownIcon } from "@/src/components/ui/icon";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/src/components/ui/modal";
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
import { useAppAlert } from "@/src/context/app-alert-context";
import {
  MeetupType,
  MeetupVisibility,
} from "@/src/entities/meetup/model/meetup";
import { SimpleSport } from "@/src/entities/sport/model/sport";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface MeetupFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when the user confirms application of filters */
  onApply: (filters: {
    type?: MeetupType;
    visibility?: MeetupVisibility;
    sports?: string[];
    dateFrom?: Date | null;
    dateTo?: Date | null;
    timeOfDay?: MeetupTimeOfDay;
  }) => void;
  /** Initial/current filter values (used to seed the modal when opened) */
  typeFilter: MeetupType | undefined;
  visibilityFilter: MeetupVisibility | undefined;
  selectedSports: string[];
  spotSports?: SimpleSport[];
  dateFrom: Date | null;
  dateTo: Date | null;
  timeOfDay: MeetupTimeOfDay | undefined;
}

export const MeetupFiltersModal: React.FC<MeetupFiltersModalProps> = ({
  isOpen,
  onClose,
  onApply,
  typeFilter,
  visibilityFilter,
  selectedSports,
  spotSports,
  dateFrom,
  dateTo,
  timeOfDay,
}) => {
  const { showSuccess } = useAppAlert();

  // Local state to hold temporary selections; only applied on 'Aplicar'
  const [localType, setLocalType] = React.useState<MeetupType | undefined>(
    typeFilter
  );
  const [localVisibility, setLocalVisibility] = React.useState<
    MeetupVisibility | undefined
  >(visibilityFilter);
  const [localSelectedSports, setLocalSelectedSports] = React.useState<
    string[]
  >(selectedSports ?? []);
  const [localDateFrom, setLocalDateFrom] = React.useState<Date | null>(
    dateFrom ?? null
  );
  const [localDateTo, setLocalDateTo] = React.useState<Date | null>(
    dateTo ?? null
  );
  const [localTimeOfDay, setLocalTimeOfDay] = React.useState<
    MeetupTimeOfDay | undefined
  >(timeOfDay);

  // When modal opens, seed local state from props
  React.useEffect(() => {
    if (isOpen) {
      setLocalType(typeFilter);
      setLocalVisibility(visibilityFilter);
      setLocalSelectedSports(selectedSports ?? []);
      setLocalDateFrom(dateFrom ?? null);
      setLocalDateTo(dateTo ?? null);
      setLocalTimeOfDay(timeOfDay);
    }
  }, [
    isOpen,
    typeFilter,
    visibilityFilter,
    selectedSports,
    dateFrom,
    dateTo,
    timeOfDay,
  ]);
  const timeOptions: { key: MeetupTimeOfDay; label: string }[] = [
    { key: "morning", label: "Morning (05-12h)" },
    { key: "afternoon", label: "Afternoon (12-18h)" },
    { key: "evening", label: "Evening (18-22h)" },
    { key: "night", label: "Night (22-05h)" },
  ];

  const typeOptions: { key: MeetupType; label: string }[] = [
    { key: MeetupType.CASUAL, label: "Casual" },
    { key: MeetupType.ROUTINE, label: "Rutina" },
    { key: MeetupType.MATCH, label: "Match" },
    { key: MeetupType.TOURNAMENT, label: "Tournament" },
  ];

  const visibilityOptions: { key: MeetupVisibility; label: string }[] = [
    { key: MeetupVisibility.OPEN, label: "Open" },
    { key: MeetupVisibility.CLOSED, label: "Closed" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Text className="text-lg font-semibold text-gray-900">Filters</Text>
          <Button
            onPress={onClose}
            variant="outline"
            size="sm"
            className="px-2"
          >
            <ButtonText className="text-blue-600">Close</ButtonText>
          </Button>
        </ModalHeader>

        <ModalBody>
          <View className="gap-4">
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Visibility
              </Text>
              <Select
                selectedValue={localVisibility}
                onValueChange={(val) =>
                  setLocalVisibility(val as MeetupVisibility | undefined)
                }
              >
                <SelectTrigger>
                  <SelectInput
                    placeholder="All (open and closed)"
                    value={
                      localVisibility
                        ? visibilityOptions.find(
                            (o) => o.key === localVisibility
                          )?.label
                        : undefined
                    }
                  />
                  <SelectIcon as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {visibilityOptions.map((option) => (
                      <SelectItem
                        key={option.key}
                        label={option.label}
                        value={option.key}
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </View>

            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Meetup type
              </Text>
              <Select
                selectedValue={localType}
                onValueChange={(val) =>
                  setLocalType(val as MeetupType | undefined)
                }
              >
                <SelectTrigger>
                  <SelectInput
                    placeholder="All meetups"
                    value={
                      localType
                        ? typeOptions.find((o) => o.key === localType)?.label
                        : undefined
                    }
                  />
                  <SelectIcon as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {typeOptions.map((option) => (
                      <SelectItem
                        key={option.key}
                        label={option.label}
                        value={option.key}
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </View>

            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Schedule
              </Text>
              <Select
                selectedValue={localTimeOfDay}
                onValueChange={(val) =>
                  setLocalTimeOfDay(val as MeetupTimeOfDay | undefined)
                }
              >
                <SelectTrigger>
                  <SelectInput
                    placeholder="All times"
                    value={
                      localTimeOfDay
                        ? timeOptions.find((o) => o.key === localTimeOfDay)
                            ?.label
                        : undefined
                    }
                  />
                  <SelectIcon as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {timeOptions.map((option) => (
                      <SelectItem
                        key={option.key}
                        label={option.label}
                        value={option.key}
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </View>

            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Spot sports
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(spotSports ?? []).map((sport) => (
                  <Pressable
                    key={sport.id}
                    onPress={() => {
                      console.debug(
                        "[MeetupFiltersModal] toggling sport",
                        sport.id,
                        sport.name
                      );
                      setLocalSelectedSports((prev) =>
                        prev.includes(sport.id)
                          ? prev.filter((id) => id !== sport.id)
                          : [...prev, sport.id]
                      );
                    }}
                    className={`px-3 py-2 rounded-full border ${
                      localSelectedSports.includes(sport.id)
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={
                        localSelectedSports.includes(sport.id)
                          ? "text-white font-semibold"
                          : "text-gray-700"
                      }
                    >
                      {sport.name}
                    </Text>
                  </Pressable>
                ))}
                {!spotSports?.length && (
                  <View className="justify-center">
                    <Text className="text-gray-500">
                      No sports configured for this spot.
                    </Text>
                  </View>
                )}
              </View>
              <View className="mt-2">
                <Text className="text-xs text-gray-500">
                  * Changes will only be applied when clicking{" "}
                  <Text className="font-medium">Apply</Text>
                </Text>
              </View>
            </View>

            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Event date
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 mb-1">From</Text>
                  <DatePickerComponent
                    value={localDateFrom}
                    onChange={setLocalDateFrom}
                    placeholder="Select start date"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 mb-1">To</Text>
                  <DatePickerComponent
                    value={localDateTo}
                    onChange={setLocalDateTo}
                    placeholder="Select end date"
                  />
                </View>
              </View>
            </View>
          </View>
        </ModalBody>

        <ModalFooter>
          <View className="flex-row justify-between w-full">
            <Pressable
              onPress={() => {
                // Cancel: close without applying
                console.debug("[MeetupFiltersModal] canceling (no apply)");
                onClose();
              }}
              className="px-4 py-2 rounded-md border border-gray-300"
            >
              <Text className="text-sm font-medium text-gray-700">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                // Clear and apply immediately
                setLocalType(undefined);
                setLocalVisibility(undefined);
                setLocalSelectedSports([]);
                setLocalDateFrom(null);
                setLocalDateTo(null);
                setLocalTimeOfDay(undefined);
                console.debug(
                  "[MeetupFiltersModal] clearing and applying filters"
                );

                const applied = {
                  type: undefined,
                  visibility: undefined,
                  sports: undefined,
                  dateFrom: undefined,
                  dateTo: undefined,
                  timeOfDay: undefined,
                };

                onApply(applied);
                showSuccess("Filters cleared");
              }}
              className="px-4 py-2 rounded-md border border-gray-300"
            >
              <Text className="text-sm font-medium text-gray-700">Clear</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                // Apply local selections to parent and close
                const applied = {
                  type: localType,
                  visibility: localVisibility,
                  sports: localSelectedSports.length
                    ? localSelectedSports
                    : undefined,
                  dateFrom: localDateFrom ?? undefined,
                  dateTo: localDateTo ?? undefined,
                  timeOfDay: localTimeOfDay ?? undefined,
                };
                console.debug(
                  "[MeetupFiltersModal] applying filters:",
                  applied
                );
                onApply(applied);
                showSuccess("Filters applied");
                onClose();
              }}
              className="px-4 py-2 rounded-md bg-blue-600"
            >
              <Text className="text-sm font-semibold text-white">Apply</Text>
            </Pressable>
          </View>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
