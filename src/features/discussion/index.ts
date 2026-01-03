export { DiscussionForm } from './components/discussion-create/discussion-form';
export { DiscussionCard } from './components/discussion-list/discussion-card';
export { DiscussionListWithFilters } from './components/discussion-list/discussion-list-with-filters';
export type { DiscussionListWithFiltersControls } from './components/discussion-list/discussion-list-with-filters';
export { DiscussionHeader } from './components/discussion-view/discussion-header';
export { DiscussionFilterButton, DiscussionFilterModal } from './components/filters';
export { ProfileDiscussionList } from './components/profile-discussion-view/profile-discussion-list';
export type { ProfileDiscussionListProps } from './components/profile-discussion-view/profile-discussion-list';
export { AVAILABLE_TAG_LABELS, AVAILABLE_TAGS, DEFAULT_TAG_LABELS, DEFAULT_TAGS, getContrastingTextColor, getTagColor } from './constants/tags';
export { useCreateDiscussion } from './hooks/use-create-discussion';
export { useDiscussionDetails } from './hooks/use-discussion-details';
export { useDiscussionLoad } from './hooks/use-discussion-load';
export { useDiscussionVote } from './hooks/use-discussion-vote';
export { useUpdateDiscussion } from './hooks/use-update-discussion';
export { useUserDiscussions } from './hooks/use-user-discussions';

// Types
export type { DiscussionFilters, DiscussionSortOptions } from './types/discussion-filter-types';

