import { useState } from 'react';
import { CreateTestCaseDto, CreateProblemDto } from '@/types/dto';
import { Difficulty } from '@/types/enums';

type TestCaseInput = CreateTestCaseDto & { id: string };

export function useProblemForm(initialData?: {
  title?: string;
  slug?: string;
  description?: string;
  difficulty?: Difficulty;
  timeLimit?: number;
  memoryLimit?: number;
  jsCode?: string;
  pythonCode?: string;
  testCases?: TestCaseInput[];
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [description, setDescription] = useState(
    initialData?.description || '',
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    initialData?.difficulty || Difficulty.EASY,
  );
  const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 1000);
  const [memoryLimit, setMemoryLimit] = useState(
    initialData?.memoryLimit || 256,
  );
  const [jsCode, setJsCode] = useState(initialData?.jsCode || '');
  const [pythonCode, setPythonCode] = useState(initialData?.pythonCode || '');
  const [testCases, setTestCases] = useState<TestCaseInput[]>(
    initialData?.testCases || [
      { id: '1', input: '', output: '', isPublic: true },
    ],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(generateSlug(value));
  };

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      { id: Date.now().toString(), input: '', output: '', isPublic: false },
    ]);
  };

  const removeTestCase = (id: string) => {
    setTestCases(testCases.filter((tc) => tc.id !== id));
  };

  const updateTestCase = (
    id: string,
    field: keyof CreateTestCaseDto,
    value: string | boolean,
  ) => {
    setTestCases(
      testCases.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc)),
    );
  };

  const validateForm = (): boolean => {
    setError('');

    if (!title || !slug || !description || !jsCode || !pythonCode) {
      setError('Please fill in all required fields');
      return false;
    }

    if (testCases.length === 0) {
      setError('Please add at least one test case');
      return false;
    }

    for (const tc of testCases) {
      if (!tc.input.trim() || !tc.output.trim()) {
        setError('All test cases must have input and output');
        return false;
      }

      try {
        JSON.parse(tc.input);
      } catch (e) {
        setError(
          `Test case input must be valid JSON. Error in test case with input: "${tc.input.substring(0, 50)}..."`,
        );
        return false;
      }

      try {
        JSON.parse(tc.output);
      } catch (e) {
        setError(
          `Test case output must be valid JSON. Error in test case with output: "${tc.output.substring(0, 50)}..."`,
        );
        return false;
      }
    }

    return true;
  };

  const buildPayload = (): CreateProblemDto => {
    return {
      title,
      slug,
      description,
      difficulty,
      timeLimit,
      memoryLimit,
      starterCode: {
        JAVASCRIPT: jsCode,
        PYTHON: pythonCode,
      },
      testCases: testCases.map(({ id, ...tc }) => tc),
    };
  };

  const setData = (data: {
    title: string;
    slug: string;
    description: string;
    difficulty: Difficulty;
    timeLimit: number;
    memoryLimit: number;
    jsCode: string;
    pythonCode: string;
    testCases: TestCaseInput[];
  }) => {
    setTitle(data.title);
    setSlug(data.slug);
    setDescription(data.description);
    setDifficulty(data.difficulty);
    setTimeLimit(data.timeLimit);
    setMemoryLimit(data.memoryLimit);
    setJsCode(data.jsCode);
    setPythonCode(data.pythonCode);
    setTestCases(data.testCases);
  };

  return {
    
    title,
    slug,
    description,
    difficulty,
    timeLimit,
    memoryLimit,
    jsCode,
    pythonCode,
    testCases,
    isSubmitting,
    error,
    
    setTitle,
    setSlug,
    setDescription,
    setDifficulty,
    setTimeLimit,
    setMemoryLimit,
    setJsCode,
    setPythonCode,
    setTestCases,
    setIsSubmitting,
    setError,
    setData,
    
    handleTitleChange,
    addTestCase,
    removeTestCase,
    updateTestCase,
    validateForm,
    buildPayload,
  };
}
