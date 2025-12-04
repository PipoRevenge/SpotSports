/* legacy string-based tag lists removed - using structured tags with colors */

export interface Tag {
  label: string;
  color?: string; // Hex color code or named color
}

export const DEFAULT_TAGS: Tag[] = [
  { label: 'Q&A', color: '#9B59B6' },
  { label: 'Guide', color: '#4ECDC4' },
];

export const AVAILABLE_TAGS: Tag[] = [
  ...DEFAULT_TAGS,
  { label: 'Workout', color: '#FF6B6B' },
  { label: 'Nutrition', color: '#2ECC71' },
  { label: 'Tips', color: '#3498DB' },
  { label: 'Events', color: '#E67E22' },
  { label: 'Help', color: '#E74C3C' },
  { label: 'Coaching', color: '#7B61FF' },
  { label: 'Equipment', color: '#1ABC9C' },
];

export const DEFAULT_TAG_LABELS = DEFAULT_TAGS.map(t => t.label);
export const AVAILABLE_TAG_LABELS = AVAILABLE_TAGS.map(t => t.label);

export function getTagColor(label: string): string | undefined {
  const tag = AVAILABLE_TAGS.find(t => t.label === label);
  return tag?.color;
}

// Utility: return best readable text color (#000 or #fff) for provided bg color hex
export { getContrastingTextColor } from '@/src/utils/color-utils';

