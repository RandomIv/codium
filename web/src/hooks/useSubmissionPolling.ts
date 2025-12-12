import { useQuery } from '@tanstack/react-query';
import { fetchSubmissionById } from '@/lib/problems';
import { SubmissionStatus } from '@/types/enums';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useEffect } from 'react';

export const useSubmissionPolling = (submissionId: string | null) => {
  const setTestLogs = useWorkspaceStore((state) => state.setTestLogs);

  const query = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => fetchSubmissionById(submissionId!),
    enabled: !!submissionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (
        status === SubmissionStatus.COMPLETED ||
        status === SubmissionStatus.FAILED
      ) {
        return false;
      }

      return 1000;
    },
  });

  useEffect(() => {
    const data = query.data;
    if (!data) return;

    if (data.status === SubmissionStatus.COMPLETED) {
      setTestLogs(data.testLogs);
    } else if (data.status === SubmissionStatus.FAILED) {
      console.error('Submission execution failed');
    }
  }, [query.data, setTestLogs]);

  return {
    ...query,
    isPolling:
      !!submissionId &&
      query.data?.status !== SubmissionStatus.COMPLETED &&
      query.data?.status !== SubmissionStatus.FAILED,
  };
};
