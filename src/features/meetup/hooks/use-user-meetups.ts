import React from 'react';
import { StoredUserMeetup, clearUserMeetups, getUserMeetups, removeUserMeetup, saveUserMeetup } from '../storage/user-meetups-storage';

export const useUserMeetups = (userId?: string) => {
  const [items, setItems] = React.useState<StoredUserMeetup[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!userId) return setItems([]);
    setLoading(true);
    const data = await getUserMeetups(userId);
    setItems(data);
    setLoading(false);
  }, [userId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = React.useCallback(async (m: StoredUserMeetup) => {
    if (!userId) return;
    await saveUserMeetup(userId, m);
    await load();
  }, [userId, load]);

  const remove = React.useCallback(async (meetupId: string) => {
    if (!userId) return;
    await removeUserMeetup(userId, meetupId);
    await load();
  }, [userId, load]);

  const clear = React.useCallback(async () => {
    if (!userId) return;
    await clearUserMeetups(userId);
    await load();
  }, [userId, load]);

  return {
    items,
    loading,
    reload: load,
    save,
    remove,
    clear,
  } as const;
};
