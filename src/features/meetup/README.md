# Meetup Feature

Design and implementation notes for the Meetup feature (Quedadas).

Goals
- Strict polymorphism: Discriminated union `Meetup = CasualMeetup | TournamentMeetup | MatchMeetup` in `src/entities/meetup`.
- Validation with `zod` using `z.discriminatedUnion('type', [...])` and composable schemas.
- UI Factory: `MeetupCardRenderer` to dispatch rendering to specific components.
- Repository pattern in `src/api/repositories` with atomic `joinMeetup` using `runTransaction` and chat creation via `chatRepository`.

Files
- `entities/meetup/index.ts` - Entities and union types
- `features/meetup/utils/validation.ts` - Zod schemas
- `features/meetup/components/card/*` - Cards per meetup type + renderer
- `features/meetup/components/meetup-list/meetup-list.tsx` - List component used on `Spot` page
- `features/meetup/components/forms/create-meetup-form.tsx` - Form to create meetups (uses React Hook Form + Zod)
- `api/repositories/implementations/meetup-repository-impl.ts` - Firestore implementation (join/leave/create/get)

Next steps
- Add `src/app/meetup/[meetupId].tsx` page to show meetup details and chat link.
- Implement tests for `meetupRepository` (transactional `joinMeetup`).
- Improve error handling and notifications in UI.
- Ensure `react-hook-form` and `@hookform/resolvers` are installed in the project.
