'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspaceStore } from '@/store/workspace-store';
import { Language } from '@/types/enums'; // Переконайся, що шлях вірний

export default function LanguagePicker() {
  const { language, setLanguage } = useWorkspaceStore();

  return (
    <div className="absolute right-4 flex items-center bg-muted">
      <Select
        value={language}
        onValueChange={(val) => setLanguage(val as Language)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select language..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Languages</SelectLabel>
            <SelectItem value={Language.JAVASCRIPT}>Javascript</SelectItem>
            <SelectItem value={Language.PYTHON}>Python</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
