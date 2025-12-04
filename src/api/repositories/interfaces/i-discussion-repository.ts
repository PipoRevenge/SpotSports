import { Discussion, DiscussionDetails } from '@/src/entities/discussion/model/discussion';

export interface IDiscussionRepository {
  createDiscussion(userId: string, discussionData: DiscussionDetails): Promise<Discussion>;
  getDiscussionById(discussionId: string): Promise<Discussion | null>;
  getDiscussions(options: { page: number; pageSize: number; sort?: 'newest' | 'mostVoted'; tag?: string; search?: string; spotId?: string }): Promise<{ discussions: Discussion[]; total: number }>;
  updateDiscussion(discussionId: string, updates: Partial<DiscussionDetails>): Promise<Discussion>;
  deleteDiscussion(discussionId: string): Promise<void>;
  /**
   * Vota en un discussion - deprecated
   * @deprecated - Moved to IVoteRepository; use voteRepository.vote('discussion', discussionId, userId, isLike)
   */
  voteDiscussion(discussionId: string, userId: string, isLike: boolean): Promise<void>;

  /**
   * Elimina voto en discussion - deprecated
   * @deprecated - Moved to IVoteRepository; use voteRepository.removeVote('discussion', discussionId, userId)
   */
  removeDiscussionVote(discussionId: string, userId: string): Promise<void>;

  /**
   * Obtiene voto de usuario en discussion - deprecated
   * @deprecated - Moved to IVoteRepository; use voteRepository.getUserVote('discussion', discussionId, userId)
   */
  getUserVoteDiscussion(discussionId: string, userId: string): Promise<boolean | null>;
  uploadDiscussionMedia(spotId: string, discussionId: string, mediaUris: string[]): Promise<string[]>;
}
