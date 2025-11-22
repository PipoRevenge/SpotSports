# Relationships feature

Feature to manage user followers and followings.

Exports:
- `useFollow(targetUserId)` hook: toggles follow/unfollow for the current user and returns follow state.
- `useFollowers(userId)` and `useFollowing(userId)` hooks: return paginated lists of `User[]` for followers and following.
- UI components: `RelationshipList` and `RelationshipListItem`.

This feature uses the `userRepository` which implements relationship logic using a Firestore collection `relationships` with deterministic docId `${follower}_${followed}`.
