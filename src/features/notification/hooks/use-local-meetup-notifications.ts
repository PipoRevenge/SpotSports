/**
 * Local Meetup Notifications Hook
 *
 * Schedules local notifications for meetups 1 hour before start time.
 * Works offline - notifications are scheduled on the device itself.
 * Also creates notification documents in Firestore so they appear in the notification list.
 *
 * Uses Expo Notifications API.
 */
import { meetupRepository, notificationRepository } from '@/src/api/repositories';
import {
    getUserMeetups,
    replaceAllUserMeetups,
    saveUserMeetup,
    StoredUserMeetup,
} from '@/src/features/meetup/storage/user-meetups-storage';
import * as Notifications from 'expo-notifications';
import { useCallback } from 'react';

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Schedule local notification for a meetup (1 hour before)
 * Also creates the notification document in Firestore
 * Returns the notification ID or undefined if not scheduled
 */
export async function scheduleMeetupLocalNotification(
  meetup: StoredUserMeetup,
  userId: string
): Promise<{ hour1?: string } | null> {
  const meetupDate = meetup.date ?? meetup.nextDate;
  if (!meetupDate) {
    console.debug('[LocalNotif] No date for meetup', meetup.id);
    return null;
  }

  const triggerTime = meetupDate - ONE_HOUR_MS;
  const now = Date.now();

  // Don't schedule if already in the past
  if (triggerTime <= now) {
    console.debug('[LocalNotif] Trigger time already passed for', meetup.id);
    return null;
  }

  try {
    // 1. Schedule local device notification
    const hour1Id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Meetup Starting Soon!',
        body: `"${meetup.title}" starts in 1 hour!`,
        data: {
          type: 'MEETUP_REMINDER',
          meetupId: meetup.id,
          spotId: meetup.spotId,
          reminderType: 'hour1',
        },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerTime),
      },
    });

    console.debug('[LocalNotif] Scheduled 1h reminder for', meetup.id, 'id:', hour1Id);

    // 2. Create notification document in Firestore
    try {
      await notificationRepository.createNotification(userId, {
        type: 'MEETUP_REMINDER',
        title: 'Meetup Starting Soon!',
        body: `"${meetup.title}" starts in 1 hour!`,
        data: {
          url: `/spot/${meetup.spotId}/meetup/${meetup.id}`,
          entityId: meetup.id,
          spotId: meetup.spotId,
          reminderType: 'hour1',
        },
      });
      console.debug('[LocalNotif] Created Firestore notification for', meetup.id);
    } catch (firestoreError) {
      // Don't fail the whole operation if Firestore write fails (offline scenario)
      console.warn('[LocalNotif] Failed to create Firestore notification (may be offline):', firestoreError);
    }

    // 3. Update stored meetup with notification ID
    const updated: StoredUserMeetup = {
      ...meetup,
      scheduledNotificationIds: {
        ...meetup.scheduledNotificationIds,
        hour1: hour1Id,
      },
    };
    await saveUserMeetup(userId, updated);

    return { hour1: hour1Id };
  } catch (error) {
    console.error('[LocalNotif] Failed to schedule notification', error);
    return null;
  }
}

/**
 * Cancel local notifications for a meetup
 */
export async function cancelMeetupLocalNotifications(
  meetup: StoredUserMeetup,
  userId: string
): Promise<void> {
  const ids = meetup.scheduledNotificationIds;
  if (!ids) return;

  try {
    if (ids.hour1) {
      await Notifications.cancelScheduledNotificationAsync(ids.hour1);
      console.debug('[LocalNotif] Cancelled 1h notification for', meetup.id);
    }
    if (ids.hour24) {
      await Notifications.cancelScheduledNotificationAsync(ids.hour24);
      console.debug('[LocalNotif] Cancelled 24h notification for', meetup.id);
    }

    // Clear IDs from storage
    const updated: StoredUserMeetup = {
      ...meetup,
      scheduledNotificationIds: undefined,
    };
    await saveUserMeetup(userId, updated);
  } catch (error) {
    console.error('[LocalNotif] Failed to cancel notifications', error);
  }
}

/**
 * Re-sync all meetup notifications on app startup
 * Ensures notifications are scheduled for future meetups and storage is synced with backend
 */
export async function resyncAllMeetupNotifications(userId: string): Promise<void> {
  if (!userId) return;

  try {
    console.debug('[LocalNotif] Starting full sync for user', userId);

    // 1. Fetch truth from backend
    const remoteMeetups = await meetupRepository.getMeetupsByUser(userId);
    const localMeetups = await getUserMeetups(userId);
    const now = Date.now();
    
    // Map of existing notifications to preserve them if meetup still exists
    const notificationMap = new Map<string, { hour1?: string; hour24?: string }>();
    localMeetups.forEach(m => {
      if (m.scheduledNotificationIds) {
        notificationMap.set(m.id, m.scheduledNotificationIds);
      }
    });

    // 2. Prepare new storage state
    const syncedMeetups: StoredUserMeetup[] = remoteMeetups.map(m => {
      const existingNotifs = notificationMap.get(m.id);
      return {
        id: m.id,
        spotId: m.spotId,
        title: m.title,
        date: m.date ? new Date(m.date).getTime() : undefined,
        nextDate: (m as any).nextDate ? new Date((m as any).nextDate).getTime() : undefined,
        sport: (m as any).sport ?? null,
        organizerId: m.organizerId ?? null,
        updatedAt: Date.now(),
        location: (m as any).spot?.location ?? undefined, // Try to preserve location if available
        scheduledNotificationIds: existingNotifs,
      };
    });

    // 3. Update storage (this prevents deleted meetups from persisting)
    await replaceAllUserMeetups(userId, syncedMeetups);
    
    // 4. Clean up orphaned notifications (optional but good practice)
    // We can't easily query Expo for all scheduled notifs by tag, but we can rely on 
    // the fact that we won't show them in the UI lists anymore.
    // Ideally we would track all IDs and cancel ones not in syncedMeetups.
    
    // 5. Schedule new ones if needed
    for (const meetup of syncedMeetups) {
      const meetupDate = meetup.date ?? meetup.nextDate;
      if (!meetupDate) continue;

      // Skip past meetups
      if (meetupDate < now) continue;

      // If no notification ID stored, schedule one
      if (!meetup.scheduledNotificationIds?.hour1) {
        await scheduleMeetupLocalNotification(meetup, userId);
      }
    }

    console.debug('[LocalNotif] Full sync complete. Remote:', remoteMeetups.length, 'Synced:', syncedMeetups.length);
  } catch (error) {
    console.error('[LocalNotif] Resync failed', error);
  }
}

/**
 * Hook for components to use local meetup notifications
 */
export function useLocalMeetupNotifications(userId: string | undefined) {
  const schedule = useCallback(
    async (meetup: StoredUserMeetup) => {
      if (!userId) return null;
      return scheduleMeetupLocalNotification(meetup, userId);
    },
    [userId]
  );

  const cancel = useCallback(
    async (meetup: StoredUserMeetup) => {
      if (!userId) return;
      return cancelMeetupLocalNotifications(meetup, userId);
    },
    [userId]
  );

  const resync = useCallback(async () => {
    if (!userId) return;
    return resyncAllMeetupNotifications(userId);
  }, [userId]);

  return {
    scheduleMeetupNotification: schedule,
    cancelMeetupNotification: cancel,
    resyncNotifications: resync,
  };
}

export default useLocalMeetupNotifications;
