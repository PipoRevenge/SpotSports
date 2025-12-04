export interface DiscussionDetails {
  spotId?: string; // Optional: if undefined, it's a general discussion (e.g., about sports, community)
  title: string;
  description?: string;
  tags?: string[];
  media?: string[];
}

export interface DiscussionMetadata {
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  createdBy: string;
}

export interface DiscussionActivity {
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  reports?: number;
}

export interface Discussion {
  id: string;
  details: DiscussionDetails;
  metadata: DiscussionMetadata;
  activity?: DiscussionActivity;
}
