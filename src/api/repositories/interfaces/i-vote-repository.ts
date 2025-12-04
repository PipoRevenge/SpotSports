import { VoteResourceType } from '@/src/entities/vote/model/vote';

export interface IVoteRepository {
  vote(resourceType: VoteResourceType, resourceId: string, userId: string, isLike: boolean): Promise<void>;
  removeVote(resourceType: VoteResourceType, resourceId: string, userId: string): Promise<void>;
  getUserVote(resourceType: VoteResourceType, resourceId: string, userId: string): Promise<boolean | null>;
}
