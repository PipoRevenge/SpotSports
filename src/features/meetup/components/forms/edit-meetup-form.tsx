import { HourPicker } from '@/src/components/commons/date/hour-picker-component';
import { Button, ButtonText } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { Divider } from '@/src/components/ui/divider';
import { HStack } from '@/src/components/ui/hstack';
import { ChevronDownIcon } from '@/src/components/ui/icon';
import { Input, InputField } from '@/src/components/ui/input';
import { Select, SelectContent, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from '@/src/components/ui/select';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { useAppAlert } from '@/src/context/app-alert-context';
import { useUser } from '@/src/context/user-context';
import { Meetup, MeetupType, MeetupVisibility } from '@/src/entities/meetup';
import { DateTimePicker } from '@/src/features/meetup/components/forms/date-time-picker';
import { useSpotSports } from '@/src/features/meetup/hooks/use-spot-sports';
import { useUpdateMeetup } from '@/src/features/meetup/hooks/use-update-meetup';
import { SaveIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';

interface EditMeetupFormProps {
  spotId: string;
  meetup: Meetup;
  onSuccess: () => void;
}

export const EditMeetupForm: React.FC<EditMeetupFormProps> = ({ spotId, meetup, onSuccess }) => {
  const { user } = useUser();
  const { showError, showSuccess } = useAppAlert();
  const { update, isUpdating } = useUpdateMeetup();
  const { data: sports } = useSpotSports(spotId);

  const [title, setTitle] = useState(meetup.title);
  const [description, setDescription] = useState(meetup.description || '');
  const [sport, setSport] = useState((meetup as any).sport || '');
  const [visibility, setVisibility] = useState<MeetupVisibility>((meetup as any).visibility || MeetupVisibility.OPEN);
  const [tags, setTags] = useState((meetup.tags || []).join(', '));
  
  // Casual specific
  const [minParticipants, setMinParticipants] = useState<string>((meetup as any).minParticipants?.toString() || '');
  const [participantLimit, setParticipantLimit] = useState<string>((meetup as any).participantLimit?.toString() || '');

  // Schedule
  const [selectedDate, setSelectedDate] = useState<Date | null>(meetup.date ? new Date(meetup.date) : null);
  const [routineDays, setRoutineDays] = useState<number[]>((meetup as any).daysOfWeek || []);
  const [routineTime, setRoutineTime] = useState<string>((meetup as any).time || '18:00');

  const handleUpdateDetails = async () => {
    if (!user) return;
    
    const payload: any = {
      title,
      description,
      visibility,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      sport, // Now using the ID from the selector
    };

    if (meetup.type === MeetupType.CASUAL) {
      payload.minParticipants = minParticipants ? parseInt(minParticipants) : undefined;
      payload.participantLimit = participantLimit ? parseInt(participantLimit) : undefined;
    }

    try {
      await update({ spotId, meetupId: meetup.id, data: payload, requesterId: user.id });
      showSuccess('Información actualizada');
      onSuccess();
    } catch (err) {
      showError((err as Error).message || 'Error al actualizar');
    }
  };

  const handleUpdateSchedule = async () => {
     if (!user) return;
     try {
        if (meetup.type === MeetupType.ROUTINE) {
            await update({ 
                spotId, 
                meetupId: meetup.id, 
                data: { daysOfWeek: routineDays, time: routineTime }, 
                requesterId: user.id 
            });
        } else {
            if (!selectedDate) return;
            await update({ 
                spotId, 
                meetupId: meetup.id, 
                data: { date: selectedDate }, 
                requesterId: user.id 
            });
        }
        showSuccess('Programación actualizada');
        onSuccess();
     } catch (err) {
        showError((err as Error).message || 'Error al actualizar programación');
     }
  };

  return (
    <VStack space="md" className="pb-8">
        {/* General Info Card */}
        <Card className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <Text className="text-lg font-semibold text-slate-900 mb-4">Información General</Text>
            <VStack space="md">
                <VStack space="xs">
                    <Text className="text-sm font-medium text-slate-700">Título</Text>
                    <Input size="md" className="bg-slate-50 border-slate-200">
                        <InputField value={title} onChangeText={setTitle} placeholder="Título del meetup" />
                    </Input>
                </VStack>

                <VStack space="xs">
                    <Text className="text-sm font-medium text-slate-700">Descripción</Text>
                    <Input size="md" className="bg-slate-50 border-slate-200 h-24">
                        <InputField 
                            value={description} 
                            onChangeText={setDescription} 
                            placeholder="Descripción..." 
                            multiline 
                            textAlignVertical="top"
                        />
                    </Input>
                </VStack>

                <VStack space="xs">
                    <Text className="text-sm font-medium text-slate-700">Deporte</Text>
                    <Select selectedValue={sport} onValueChange={setSport}>
                        <SelectTrigger variant="outline" size="md" className="bg-slate-50 border-slate-200 justify-between">
                            <SelectInput placeholder="Selecciona deporte" value={sports?.find(s => s.id === sport)?.name || sport} />
                            <SelectIcon className="mr-2">
                                <ChevronDownIcon />
                            </SelectIcon>
                        </SelectTrigger>
                        <SelectPortal>
                            <SelectContent>
                                {sports?.map(s => (
                                    <SelectItem key={s.id} label={s.name} value={s.id} />
                                ))}
                            </SelectContent>
                        </SelectPortal>
                    </Select>
                </VStack>

                <VStack space="xs">
                    <Text className="text-sm font-medium text-slate-700">Visibilidad</Text>
                    <Select selectedValue={visibility} onValueChange={(v) => setVisibility(v as MeetupVisibility)}>
                        <SelectTrigger variant="outline" size="md" className="bg-slate-50 border-slate-200 justify-between">
                            <SelectInput placeholder="Visibilidad" value={visibility === MeetupVisibility.OPEN ? 'Público' : 'Privado'} />
                            <SelectIcon className="mr-2">
                                <ChevronDownIcon />
                            </SelectIcon>
                        </SelectTrigger>
                        <SelectPortal>
                            <SelectContent>
                                <SelectItem label="Público" value={MeetupVisibility.OPEN} />
                                <SelectItem label="Privado" value={MeetupVisibility.CLOSED} />
                            </SelectContent>
                        </SelectPortal>
                    </Select>
                </VStack>

                <VStack space="xs">
                    <Text className="text-sm font-medium text-slate-700">Etiquetas</Text>
                    <Input size="md" className="bg-slate-50 border-slate-200">
                        <InputField value={tags} onChangeText={setTags} placeholder="Separadas por coma" />
                    </Input>
                </VStack>
            </VStack>
        </Card>

        {/* Participants (Casual) */}
        {meetup.type === MeetupType.CASUAL && (
            <Card className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                <Text className="text-lg font-semibold text-slate-900 mb-4">Participantes</Text>
                <HStack space="md">
                    <VStack space="xs" className="flex-1">
                        <Text className="text-sm font-medium text-slate-700">Mínimo</Text>
                        <Input size="md" className="bg-slate-50 border-slate-200">
                            <InputField value={minParticipants} onChangeText={setMinParticipants} keyboardType="numeric" placeholder="2" />
                        </Input>
                    </VStack>
                    <VStack space="xs" className="flex-1">
                        <Text className="text-sm font-medium text-slate-700">Máximo</Text>
                        <Input size="md" className="bg-slate-50 border-slate-200">
                            <InputField value={participantLimit} onChangeText={setParticipantLimit} keyboardType="numeric" placeholder="Sin límite" />
                        </Input>
                    </VStack>
                </HStack>
            </Card>
        )}

        <Button size="lg" onPress={handleUpdateDetails} isDisabled={isUpdating} className="bg-primary-600">
            <ButtonText className="font-bold">{isUpdating ? 'Guardando...' : 'Guardar Información'}</ButtonText>
            <SaveIcon size={18} className="text-white ml-2" />
        </Button>

        <Divider className="my-2" />

        {/* Schedule */}
        <Card className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <Text className="text-lg font-semibold text-slate-900 mb-4">Programación</Text>
            {meetup.type === MeetupType.ROUTINE ? (
                <VStack space="md">
                    <VStack space="xs">
                        <Text className="text-sm font-medium text-slate-700 mb-2">Días de la semana</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {[0,1,2,3,4,5,6].map(d => {
                                const active = routineDays.includes(d);
                                return (
                                    <Button
                                        key={d}
                                        size="sm"
                                        variant={active ? 'solid' : 'outline'}
                                        action={active ? 'primary' : 'secondary'}
                                        onPress={() => setRoutineDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                                        className={active ? 'bg-primary-600 border-primary-600' : 'border-slate-200'}
                                    >
                                        <ButtonText className={active ? 'text-white' : 'text-slate-600'}>
                                            {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]}
                                        </ButtonText>
                                    </Button>
                                );
                            })}
                        </View>
                    </VStack>
                    <VStack space="xs">
                        <Text className="text-sm font-medium text-slate-700 mb-1">Hora</Text>
                        <View className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <HourPicker value={routineTime} onChange={setRoutineTime} />
                        </View>
                    </VStack>
                </VStack>
            ) : (
                <VStack space="xs">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Fecha y Hora</Text>
                    <View className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <DateTimePicker value={selectedDate || new Date()} onChange={setSelectedDate} />
                    </View>
                </VStack>
            )}
            <Button onPress={handleUpdateSchedule} isDisabled={isUpdating} variant="outline" action="primary" className="mt-4">
                <ButtonText>{isUpdating ? 'Guardando...' : 'Actualizar Programación'}</ButtonText>
            </Button>
        </Card>
    </VStack>
  );
};