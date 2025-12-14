'use client';

import { useState, useEffect } from 'react';
import {
  fetchProblemByIdSystem,
  updateProblem,
  deleteProblem,
} from '@/lib/problems';
import { useRouter, useParams } from 'next/navigation';
import { useProblemForm } from '@/hooks/useProblemForm';
import { ProblemForm } from '@/components/ProblemForm';

export default function EditProblemPage() {
  const router = useRouter();
  const params = useParams();
  const problemId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const form = useProblemForm();

  useEffect(() => {
    const loadProblem = async () => {
      try {
        const problem = await fetchProblemByIdSystem(problemId);

        const testCases =
          problem.testCases && problem.testCases.length > 0
            ? problem.testCases.map((tc: any, index: number) => ({
                id: tc.id || index.toString(),
                input: tc.input,
                output: tc.output,
                isPublic: tc.isPublic,
              }))
            : [{ id: '1', input: '', output: '', isPublic: true }];

        form.setData({
          title: problem.title,
          slug: problem.slug,
          description: problem.description,
          difficulty: problem.difficulty,
          timeLimit: problem.timeLimit || 1000,
          memoryLimit: problem.memoryLimit || 256,
          jsCode: problem.starterCode?.JAVASCRIPT || '',
          pythonCode: problem.starterCode?.PYTHON || '',
          testCases,
        });
      } catch (err: any) {
        form.setError(err.message || 'Failed to load problem');
      } finally {
        setLoading(false);
      }
    };

    loadProblem();
  }, [problemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.validateForm()) {
      return;
    }

    form.setIsSubmitting(true);

    try {
      const payload = form.buildPayload();
      await updateProblem(problemId, payload);
      router.push('/problems');
      router.refresh();
    } catch (err: any) {
      form.setError(err.message || 'Failed to update problem');
    } finally {
      form.setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this problem? This action cannot be undone.',
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProblem(problemId);
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      form.setError(err.message || 'Failed to delete problem');
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-lg">Loading problem...</div>
      </div>
    );
  }

  return (
    <ProblemForm
      mode="edit"
      title={form.title}
      slug={form.slug}
      description={form.description}
      difficulty={form.difficulty}
      timeLimit={form.timeLimit}
      memoryLimit={form.memoryLimit}
      jsCode={form.jsCode}
      pythonCode={form.pythonCode}
      testCases={form.testCases}
      isSubmitting={form.isSubmitting}
      isDeleting={isDeleting}
      error={form.error}
      onTitleChange={form.handleTitleChange}
      onSlugChange={form.setSlug}
      onDescriptionChange={form.setDescription}
      onDifficultyChange={form.setDifficulty}
      onTimeLimitChange={form.setTimeLimit}
      onMemoryLimitChange={form.setMemoryLimit}
      onJsCodeChange={form.setJsCode}
      onPythonCodeChange={form.setPythonCode}
      onAddTestCase={form.addTestCase}
      onRemoveTestCase={form.removeTestCase}
      onUpdateTestCase={form.updateTestCase}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onDelete={handleDelete}
    />
  );
}
