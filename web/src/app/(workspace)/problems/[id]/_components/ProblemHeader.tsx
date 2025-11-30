import { Button } from '@/components/ui/button';
import { Home, Upload } from 'lucide-react';
import Link from 'next/link';
import LanguagePicker from '@/app/(workspace)/problems/[id]/_components/LanguagePicker';

export default function ProblemHeader() {
  return (
    <div className={'w-full flex items-center justify-center p-4'}>
      <nav className="absolute left-4">
        <Link href="/">
          <Home></Home>
        </Link>
      </nav>
      <Button
        className="w-1/12 h-full text-green-500 bg-muted font-extrabold text-2xl hover:cursor-pointer"
        variant="default"
      >
        Submit
        <Upload className="!w-6 !h-6"></Upload>
      </Button>
      <LanguagePicker></LanguagePicker>
    </div>
  );
}
