'use client';

import { createProblem } from '@/lib/problems';
import { useRouter } from 'next/navigation';
import { useProblemForm } from '@/hooks/useProblemForm';
import { ProblemForm } from '@/components/ProblemForm';

export default function CreateProblemPage() {
  const router = useRouter();
  const form = useProblemForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.validateForm()) {
      return;
    }

    form.setIsSubmitting(true);

    try {
      const payload = form.buildPayload();
      await createProblem(payload);
      router.push('/problems');
      router.refresh();
    } catch (err: any) {
      form.setError(err.message || 'Failed to create problem');
    } finally {
      form.setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ProblemForm
      mode="create"
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
    />
  );
}
