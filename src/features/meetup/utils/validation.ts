import { MeetupType } from '@/src/entities/meetup/model/meetup';
import { z } from 'zod';

// Base Schema (Shared fields)
const baseMeetupSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(50, 'El título es muy largo'),
  description: z.string().max(500, 'La descripción es muy larga').optional(),
  // Allow scheduling a meetup at any moment >= now (small clock skews allowed)
  date: z.date().refine((date) => date.getTime() >= Date.now(), {
    message: 'La fecha debe ser en el futuro',
  }),
  spotId: z.string().min(1, 'El Spot es obligatorio'),
  organizerId: z.string().min(1, 'El organizador es obligatorio'),
  tags: z.array(z.string()).optional(),
  status: z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED']).optional(),
  visibility: z.enum(['OPEN', 'CLOSED']).optional(),
  // chatId is usually generated after creation or passed if existing, making it optional in form data but required in entity
  // For creation form, we might not have it yet.
});

// Specific Schemas

// Casual Meetup Schema
const casualMeetupSchema = baseMeetupSchema.extend({
  type: z.literal(MeetupType.CASUAL),
  sport: z.string().min(1, 'El deporte es obligatorio'),
  minParticipants: z.number().min(2, 'Mínimo 2 participantes'),

  participantLimit: z.number().min(2, 'Mínimo 2 participantes').max(30, 'El límite máximo es 30 participantes').optional(),
});

// Tournament Meetup Schema
const tournamentMeetupSchema = baseMeetupSchema.extend({
  type: z.literal(MeetupType.TOURNAMENT),
  sport: z.string().min(1, 'El deporte es obligatorio'),
  bracketStyle: z.enum(['SINGLE_ELIMINATION', 'ROUND_ROBIN']),
  entryFee: z.number().min(0),
  maxTeams: z.number().min(2),
});

// Match Meetup Schema
const matchMeetupSchema = baseMeetupSchema.extend({
  type: z.literal(MeetupType.MATCH),
  sport: z.string().min(1, 'El deporte es obligatorio'),
  isRanked: z.boolean(),
});

// Routine Meetup Schema
const routineMeetupSchema = baseMeetupSchema.extend({
  type: z.literal(MeetupType.ROUTINE),
  // daysOfWeek: array of numbers 0..6
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1, 'Selecciona al menos un día'),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
  // nextDate will be computed by repository; optional in creation
  nextDate: z.date().optional(),
});
// Discriminated Union Schema
// This is the key for polymorphic validation. Zod will check the 'type' field
// and apply the corresponding schema.
export const meetupSchema = z.discriminatedUnion('type', [
  casualMeetupSchema,
  tournamentMeetupSchema,
  matchMeetupSchema,
  routineMeetupSchema,
]);

export type CreateMeetupFormData = z.infer<typeof meetupSchema>;
