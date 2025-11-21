import { User } from '@/src/entities/user/model/user';

export interface RelationshipListItemProps {
  user: User;
  onNavigateToProfile?: (userId: string) => void;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}

export interface RelationshipListProps {
  users: User[];
  onNavigateToProfile?: (userId: string) => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}
