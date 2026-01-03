# Discussion Filters

Components for filtering and sorting discussions.

## Components

### `DiscussionFilterModal`

Modal dialog for selecting filters and sort options.

**Features:**
- Sort by: Newest, Oldest, Most Voted
- Filter by Tags (Q&A, Guide, etc.)
- Filter by Sports (if available)
- Active filter count badge
- Clear all functionality

**Usage:**
```tsx
import { DiscussionFilterModal } from '@/src/features/discussion';

<DiscussionFilterModal
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  filters={currentFilters}
  sortBy={currentSort}
  onApply={(newFilters, newSort) => {
    setFilters(newFilters);
    setSort(newSort);
  }}
  onClear={() => {
    setFilters({});
    setSort('newest');
  }}
  availableSports={spotSports}
/>
```

### `DiscussionFilterButton`

Floating action button to open filter modal with active count badge.

**Usage:**
```tsx
import { DiscussionFilterButton } from '@/src/features/discussion';

<DiscussionFilterButton
  onPress={() => setFilterModalVisible(true)}
  activeFiltersCount={getActiveFiltersCount()}
/>
```

## Notes

- Filters follow the `DiscussionFilters` type which uses singular fields (`tag`, `sportId`)
- The modal UI uses arrays internally for better UX but converts to/from singular format
- Only the first selected tag/sport is applied (single-select behavior)
