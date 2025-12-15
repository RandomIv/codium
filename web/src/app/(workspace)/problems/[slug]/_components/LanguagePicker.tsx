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
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Language } from '@/types/enums'; 

export default function LanguagePicker() {
  const { language, setLanguage } = useWorkspaceStore();

  return (
    <div className="flex items-center bg-muted">
      <Select
        value={language}
        onValueChange={(val) => setLanguage(val as Language)}
      >
        <SelectTrigger className="w-[100px] sm:w-[140px] md:w-[180px] h-9 text-sm">
          <SelectValue placeholder="Language" />
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
