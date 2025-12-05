/**
 * Vote feature exports
 * 
 * Los hooks de votación ahora están en cada feature específica:
 * - useReviewVote: features/review
 * - useDiscussionVote: features/discussion
 * - useCommentVote: features/comment
 */

// Re-export VoteState type for backward compatibility
export type { VoteState } from '@/src/hooks/use-vote';
