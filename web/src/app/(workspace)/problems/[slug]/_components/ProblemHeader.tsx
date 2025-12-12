'use client';

import { Button } from '@/components/ui/button';
import { Home, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import LanguagePicker from './LanguagePicker';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useSubmission } from '@/hooks/useSubmission';
import { useProblem } from '@/hooks/useProblem';
import { useState } from 'react';
import { useSubmissionPolling } from '@/hooks/useSubmissionPolling';

const MOCK_USER_ID = '586ecbdc-3813-4264-a77a-4be1c7697df4';

export default function ProblemHeader() {
  const { codes, language, setTestLogs } = useWorkspaceStore();
  const currentCode = codes[language];

  const params = useParams();
  const slug = params.slug as string;

  const { data: problem } = useProblem(slug);
  const { mutate: submit, isPending: isSubmitting } = useSubmission();

  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const { isPolling } = useSubmissionPolling(submissionId);

  const handleSubmit = () => {
    if (!problem) return;

    setTestLogs(null);

    submit(
      {
        problemId: problem.id,
        code: currentCode,
        language: language,
        userId: MOCK_USER_ID,
      },
      {
        onSuccess: (data) => {
          setSubmissionId(data.id);
        },
        onError: (error) => {
          console.error('Submission error:', error);
        },
      },
    );
  };

  const isBusy = isSubmitting || isPolling;

  return (
    <div className="w-full flex items-center justify-center p-4 relative">
      <nav className="absolute left-4">
        <Link href="/">
          <Home className="text-muted-foreground hover:text-foreground transition-colors" />
        </Link>
      </nav>

      <Button
        onClick={handleSubmit}
        disabled={isBusy || !problem}
        className="w-1/12 min-w-[140px] h-full text-green-500 bg-muted font-extrabold text-2xl hover:cursor-pointer hover:bg-muted/80"
        variant="default"
      >
        {isBusy ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {isPolling ? 'Testing...' : 'Sending...'}
          </>
        ) : (
          <>
            Submit
            <Upload className="ml-2 w-6 h-6" />
          </>
        )}
      </Button>

      <LanguagePicker />
    </div>
  );
}
