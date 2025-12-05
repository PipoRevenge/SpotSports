import { Discussion, DiscussionDetails } from '@/src/entities/discussion/model/discussion';

export interface IDiscussionRepository {
  /**
   * Create a new discussion for a spot
   * @param spotId - ID of the spot
   * @param userId - ID of the user creating the discussion
   * @param discussionData - Discussion content
   */
  createDiscussion(spotId: string, userId: string, discussionData: DiscussionDetails): Promise<Discussion>;

  /**
   * Get a discussion by ID
   * If spotId is provided, queries directly. Otherwise uses collectionGroup.
   * @param discussionId - ID of the discussion
   * @param spotId - Optional spot ID for direct query (faster)
   */
  getDiscussionById(discussionId: string, spotId?: string): Promise<Discussion | null>;

  /**
   * Get discussions with pagination and filters
   * @param options - Query options including optional spotId filter
   */
  getDiscussions(options: {
    page: number;
    pageSize: number;
    spotId?: string;
    sort?: 'newest' | 'mostVoted';
    tag?: string;
    search?: string;
  }): Promise<{ discussions: Discussion[]; total: number }>;

  /**
   * Get all discussions by a user using collectionGroup query
   */
  getDiscussionsByUser(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<Discussion[]>;

  /**
   * Update a discussion
   * @param discussionId - ID of the discussion
   * @param updates - Partial updates to apply
   * @param spotId - Optional, will be fetched if not provided
   */
  updateDiscussion(
    discussionId: string,
    updates: Partial<DiscussionDetails>,
    spotId?: string
  ): Promise<Discussion>;

  /**
   * Delete a discussion (soft delete)
   * @param discussionId - ID of the discussion
   * @param spotId - Optional, will be fetched if not provided
   */
  deleteDiscussion(discussionId: string, spotId?: string): Promise<void>;

  /**
   * Upload media files for a discussion
   * @param spotId - ID of the spot (required for storage path)
   * @param discussionId - ID of the discussion
   * @param mediaUris - Array of local file URIs to upload
   */
  uploadDiscussionMedia(spotId: string, discussionId: string, mediaUris: string[]): Promise<string[]>;

  /**
   * Vota en una discussion (like o dislike)
   * Si el usuario ya votó igual, quita el voto
   * Si votó diferente, cambia el voto
   * @param spotId - ID del spot
   * @param discussionId - ID de la discussion
   * @param userId - ID del usuario que vota
   * @param isLike - true para like, false para dislike
   */
  voteDiscussion(spotId: string, discussionId: string, userId: string, isLike: boolean): Promise<void>;

  /**
   * Elimina el voto de un usuario en una discussion
   * @param spotId - ID del spot
   * @param discussionId - ID de la discussion
   * @param userId - ID del usuario
   */
  removeDiscussionVote(spotId: string, discussionId: string, userId: string): Promise<void>;

  /**
   * Obtiene el voto actual de un usuario en una discussion
   * @param spotId - ID del spot
   * @param discussionId - ID de la discussion
   * @param userId - ID del usuario
   * @returns true = like, false = dislike, null = sin voto
   */
  getDiscussionVote(spotId: string, discussionId: string, userId: string): Promise<boolean | null>;
}
