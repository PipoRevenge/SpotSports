import { HStack } from '@/src/components/ui/hstack';
import { ChevronDownIcon } from '@/src/components/ui/icon';
import { Select, SelectContent, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from '@/src/components/ui/select';
import { ChatType } from '@/src/entities/chat';
import React from 'react';

export type ChatFilter = 'all' | ChatType;

interface ChatFiltersProps {
  value: ChatFilter;
  onChange: (filter: ChatFilter) => void;
}

export const ChatFilters: React.FC<ChatFiltersProps> = ({ value, onChange }) => {
  const filterOptions = [
    { key: 'all', label: 'Todos los chats' },
    { key: 'direct', label: 'Chats directos' },
    { key: 'group', label: 'Grupos' },
    { key: 'meetup-group', label: 'Grupos de meetup' },
  ];

  return (
    <HStack className="px-4 py-2">
      <Select selectedValue={value} onValueChange={(v) => onChange(v as ChatFilter)}>
        <SelectTrigger variant="outline" size="sm" className="min-w-[180px]">
          <SelectInput 
            placeholder="Filtrar" 
            value={filterOptions.find(o => o.key === value)?.label} 
          />
          <SelectIcon as={ChevronDownIcon} />
        </SelectTrigger>
        <SelectPortal>
          <SelectContent>
            {filterOptions.map((o) => (
              <SelectItem key={o.key} label={o.label} value={o.key} />
            ))}
          </SelectContent>
        </SelectPortal>
      </Select>
    </HStack>
  );
};

export default ChatFilters;
