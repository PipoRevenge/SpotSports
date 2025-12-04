export type VoteResourceType = 'review' | 'discussion' | 'comment';

export interface Vote {
  id: string;
  resourceType: VoteResourceType;
  resourceId: string;
  userId: string;
  isLike: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
