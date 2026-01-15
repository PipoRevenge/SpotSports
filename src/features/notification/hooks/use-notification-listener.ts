import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

// Configure how notifications should handle when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Helper to construct the correct local route based on notification data.
 * Handles discrepancies between backend URL construction and frontend routing.
 */
const getNotificationRoute = (data: Record<string, any>): string | null => {
  const url = data?.url;
  
  // 1. Social Reaction (Like) on Comment
  // Backend sends: parentPath (spots/S/reviews/R/comments/C), targetType='comment'
  if (data?.parentPath && data?.targetType === 'comment') {
    const segments = data.parentPath.split('/');
    const spotIndex = segments.indexOf('spots');
    
    if (spotIndex !== -1) {
      const spotId = segments[spotIndex + 1];
      const commentId = segments[segments.length - 1]; // Last segment is commentId

      if (segments.includes('reviews')) {
        const reviewIndex = segments.indexOf('reviews');
        const reviewId = segments[reviewIndex + 1];
        return `/spot/${spotId}?reviewId=${reviewId}&commentId=${commentId}`;
      }
      
      if (segments.includes('discussions')) {
        const discussionIndex = segments.indexOf('discussions');
        const discussionId = segments[discussionIndex + 1];
        return `/spot/${spotId}/discussion/${discussionId}?commentId=${commentId}`;
      }
    }
  }

  // 2. Social Comment (New Comment)
  // Backend sends: targetType='review'|'discussion', entityId=commentId, resourceId=reviewId/discussionId
  // OR entityId != targetId/resourceId
  if (data?.type === 'SOCIAL_COMMENT' || (data?.entityId && data?.entityId !== (data?.targetId || data?.resourceId))) {
    const spotId = data.spotId;
    const resourceId = data.targetId || data.resourceId; // reviewId or discussionId
    const commentId = data.entityId;

    if (spotId && resourceId && commentId) {
       // Check if it's a review or discussion
       // Sometimes targetType is reliable, sometimes we infer from URL or other fields
       const isDiscussion = data.targetType === 'discussion' || (url && url.includes('/discussion/'));
       
       if (isDiscussion) {
         return `/spot/${spotId}/discussion/${resourceId}?commentId=${commentId}`;
       } else {
         return `/spot/${spotId}?reviewId=${resourceId}&commentId=${commentId}`;
       }
    }
  }

  // 3. New Review
  if (data?.reviewId && data?.spotId) {
    return `/spot/${data.spotId}?reviewId=${data.reviewId}`;
  }

  // 4. New Discussion
  if (data?.discussionId && data?.spotId) {
    return `/spot/${data.spotId}/discussion/${data.discussionId}`;
  }

  // 5. Fallback: Fix invalid string URLs from legacy/backend
  if (url && typeof url === 'string') {
    // Fix: /spot/[id]/review/[id] -> /spot/[id]?reviewId=[id]
    const reviewMatch = url.match(/\/spot\/([^\/]+)\/review\/([^\/]+)/);
    if (reviewMatch) {
      return `/spot/${reviewMatch[1]}?reviewId=${reviewMatch[2]}`;
    }
  }

  // Return original URL if no special handling needed
  return url || null;
};

export const useNotificationListener = () => {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleNavigation = (data: Notifications.Notification['request']['content']['data']) => {
      console.log('Notification data:', data);
      const targetRoute = getNotificationRoute(data);
      console.log('Computed Route:', targetRoute);

      if (targetRoute) {
        try {
            router.push(targetRoute as any);
        } catch (e) {
            console.error('Navigation failed', e);
        }
      }
    };

    // Handle cold start when the app is opened from a notification
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!isMounted || !response) return;
        handleNavigation(response.notification.request.content.data);
      })
      .catch((error) => console.error('Error reading last notification response', error));

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        // You could handle custom UI updates here or let the system alert show
        console.log('Notification received in foreground:', notification.request.content.title);
    });

    // This listener is fired whenever a user taps on or interacts with a notification
    // (works when app is foreground, background, or killed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped with data:', data);
      handleNavigation(data);
    });

    return () => {
      isMounted = false;
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, [router]);
};
