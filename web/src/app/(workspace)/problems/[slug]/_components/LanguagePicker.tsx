import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function LanguagePicker() {
  return (
    <div className="absolute right-4 flex items-center bg-muted">
      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select language..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Languages</SelectLabel>
            <SelectItem value="javascript">Javascript</SelectItem>
            <SelectItem value="python">Python</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
