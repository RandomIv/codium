'use client';

import { Button } from '@/components/ui/button';
import { Home, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import LanguagePicker from './LanguagePicker';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useSubmission } from '@/hooks/useSubmission';
import { useProblem } from '@/hooks/useProblem';
import { useState } from 'react';
import { useSubmissionPolling } from '@/hooks/useSubmissionPolling';
import { useAuthStore } from '@/store/authStore';

export default function ProblemHeader() {
  const { codes, language, setTestLogs } = useWorkspaceStore();
  const currentCode = codes[language];

  const { user } = useAuthStore();

  const params = useParams();
  const slug = params.slug as string;

  const { data: problem } = useProblem(slug);
  const { mutate: submit, isPending: isSubmitting } = useSubmission();

  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const { isPolling } = useSubmissionPolling(submissionId);

  const handleSubmit = () => {
    if (!user) {
      alert('Будь ласка, увійдіть у систему, щоб відправити код.');
      return;
    }

    if (!problem) return;

    setTestLogs(null);

    submit(
      {
        problemId: problem.id,
        code: currentCode,
        language: language,
        userId: user.id,
      },
      {
        onSuccess: (data) => {
          setSubmissionId(data.id);
        },
        onError: (error) => {
          console.error('Submission error:', error);
          alert('Failed to submit solution');
        },
      },
    );
  };

  const isBusy = isSubmitting || isPolling;

  return (
    <div className="w-full flex items-center justify-between md:justify-center p-2 md:p-4 relative border-b border-border bg-card/50">
      <nav className="md:absolute md:left-4">
        <Link href="/problems">
          <Home className="text-muted-foreground hover:text-foreground transition-colors w-5 h-5 md:w-6 md:h-6" />
        </Link>
      </nav>

      <Button
        onClick={handleSubmit}
        disabled={isBusy || !problem}
        className="w-auto md:w-1/12 md:min-w-[140px] px-3 md:px-4 h-9 md:h-10 text-green-500 bg-muted font-bold md:font-extrabold text-base md:text-2xl hover:cursor-pointer hover:bg-muted/80"
        variant="default"
      >
        {isBusy ? (
          <>
            <Loader2 className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
            <span className="hidden sm:inline">
              {isPolling ? 'Testing...' : 'Sending...'}
            </span>
            <span className="sm:hidden">...</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Submit</span>
            <span className="sm:hidden">Run</span>
            <Upload className="ml-1 md:ml-2 w-4 h-4 md:w-6 md:h-6" />
          </>
        )}
      </Button>

      <div className="md:absolute md:right-4">
        <LanguagePicker />
      </div>
    </div>
  );
}
