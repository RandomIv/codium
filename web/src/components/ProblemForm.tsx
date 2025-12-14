'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateTestCaseDto } from '@/types/dto';
import { Difficulty } from '@/types/enums';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type TestCaseInput = CreateTestCaseDto & { id: string };

interface ProblemFormProps {
  mode: 'create' | 'edit';
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  timeLimit: number;
  memoryLimit: number;
  jsCode: string;
  pythonCode: string;
  testCases: TestCaseInput[];
  isSubmitting: boolean;
  isDeleting?: boolean;
  error: string;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDifficultyChange: (value: Difficulty) => void;
  onTimeLimitChange: (value: number) => void;
  onMemoryLimitChange: (value: number) => void;
  onJsCodeChange: (value: string) => void;
  onPythonCodeChange: (value: string) => void;
  onAddTestCase: () => void;
  onRemoveTestCase: (id: string) => void;
  onUpdateTestCase: (
    id: string,
    field: keyof CreateTestCaseDto,
    value: string | boolean,
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const validateJSON = (value: string): { valid: boolean; error?: string } => {
  if (!value.trim()) {
    return { valid: false, error: 'Cannot be empty' };
  }

  try {
    JSON.parse(value);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid JSON format' };
  }
};

export function ProblemForm({
  mode,
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
  isDeleting = false,
  error,
  onTitleChange,
  onSlugChange,
  onDescriptionChange,
  onDifficultyChange,
  onTimeLimitChange,
  onMemoryLimitChange,
  onJsCodeChange,
  onPythonCodeChange,
  onAddTestCase,
  onRemoveTestCase,
  onUpdateTestCase,
  onSubmit,
  onCancel,
  onDelete,
}: ProblemFormProps) {
  const [validationState, setValidationState] = useState<
    Record<string, { inputValid: boolean; outputValid: boolean }>
  >({});

  const handleTestCaseChange = (
    id: string,
    field: 'input' | 'output',
    value: string,
  ) => {
    onUpdateTestCase(id, field, value);

    const validation = validateJSON(value);
    setValidationState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [`${field}Valid`]: validation.valid,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-foreground">
            {mode === 'create' ? 'Create New Problem' : 'Edit Problem'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {mode === 'create'
              ? 'Add a new algorithmic challenge to the platform'
              : 'Update the problem details and configuration'}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
            📋 Test Case Format Requirements
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>
              <strong>Input & Output must be valid JSON:</strong>
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <strong>Array:</strong> <code>[[2,7,11,15], 9]</code> or{' '}
                <code>[1, 2, 3]</code>
              </li>
              <li>
                <strong>String:</strong> <code>"hello"</code> (with quotes!)
              </li>
              <li>
                <strong>Number:</strong> <code>42</code>
              </li>
              <li>
                <strong>Boolean:</strong> <code>true</code> or{' '}
                <code>false</code>
              </li>
              <li>
                <strong>Object:</strong>{' '}
                <code>
                  {'{'}\"key\": \"value\"{'}'}
                </code>
              </li>
            </ul>
            <p className="mt-2 text-xs">
              💡 The judge service uses <code>JSON.parse()</code> to process
              test cases
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <Card className="bg-card border border-border shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-extrabold text-foreground">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                  <Label
                    htmlFor="title"
                    className="text-base font-bold text-foreground"
                  >
                    Problem Title *
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="e.g., Two Sum"
                    className="bg-muted border-border text-foreground h-12 text-base"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="difficulty"
                    className="text-base font-bold text-foreground"
                  >
                    Difficulty Level *
                  </Label>
                  <Select
                    value={difficulty}
                    onValueChange={(value) =>
                      onDifficultyChange(value as Difficulty)
                    }
                  >
                    <SelectTrigger className="w-full bg-muted border-border text-foreground h-12 text-base">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={Difficulty.EASY}>Easy</SelectItem>
                        <SelectItem value={Difficulty.MEDIUM}>
                          Medium
                        </SelectItem>
                        <SelectItem value={Difficulty.HARD}>Hard</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="slug"
                  className="text-base font-bold text-foreground"
                >
                  Slug (auto-generated) *
                </Label>
                <Input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => onSlugChange(e.target.value)}
                  placeholder="e.g., two-sum"
                  className="bg-muted border-border text-foreground h-12 text-base font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="timeLimit"
                    className="text-base font-bold text-foreground"
                  >
                    Time Limit (ms)
                  </Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={timeLimit}
                    onChange={(e) => onTimeLimitChange(Number(e.target.value))}
                    placeholder="1000"
                    min="1"
                    className="bg-muted border-border text-foreground h-12 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="memoryLimit"
                    className="text-base font-bold text-foreground"
                  >
                    Memory Limit (MB)
                  </Label>
                  <Input
                    id="memoryLimit"
                    type="number"
                    value={memoryLimit}
                    onChange={(e) =>
                      onMemoryLimitChange(Number(e.target.value))
                    }
                    placeholder="256"
                    min="1"
                    className="bg-muted border-border text-foreground h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="description"
                  className="text-base font-bold text-foreground"
                >
                  Problem Description (Markdown) *
                </Label>
                <Tabs defaultValue="write" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="write" className="mt-2">
                    <textarea
                      id="description"
                      rows={12}
                      value={description}
                      onChange={(e) => onDescriptionChange(e.target.value)}
                      placeholder="Describe the problem in detail. Supports Markdown formatting.&#10;&#10;**Example:**&#10;# Two Sum&#10;Given an array of integers `nums` and an integer `target`...&#10;&#10;## Constraints:&#10;* $2 \le nums.length \le 10^4$"
                      className="w-full p-4 bg-muted border border-border rounded-md text-foreground text-base resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                      required
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-2">
                    <div className="w-full min-h-72 p-4 bg-muted border border-border rounded-md overflow-auto">
                      {description ? (
                        <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-code:bg-card prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-card prose-pre:border prose-pre:border-border prose-a:text-primary">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {description}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">
                          Preview will appear here...
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                <p className="text-xs text-muted-foreground">
                  💡 Supports Markdown: **bold**, *italic*, `code`, LaTeX math:
                  $x^2$, lists, tables, etc.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-lg">
            <CardHeader className="pb-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-extrabold text-foreground">
                  Test Cases
                </CardTitle>
                <Button type="button" onClick={onAddTestCase} variant="outline">
                  Add Test Case
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {testCases.map((tc, index) => {
                const inputValidation = validateJSON(tc.input);
                const outputValidation = validateJSON(tc.output);
                const isValid = inputValidation.valid && outputValidation.valid;

                return (
                  <div
                    key={tc.id}
                    className={`p-4 border rounded-lg space-y-4 ${
                      isValid
                        ? 'border-border'
                        : 'border-destructive bg-destructive/5'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold">
                        Test Case {index + 1}
                        {tc.isPublic && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            (Public Example)
                          </span>
                        )}
                        {!isValid && (
                          <span className="ml-2 text-sm text-destructive">
                            ⚠️ Invalid JSON
                          </span>
                        )}
                      </h4>
                      {testCases.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => onRemoveTestCase(tc.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold">
                          Input (JSON) *
                        </Label>
                        <Input
                          value={tc.input}
                          onChange={(e) =>
                            handleTestCaseChange(tc.id, 'input', e.target.value)
                          }
                          placeholder="e.g., [[2,7,11,15], 9]"
                          className={`bg-muted border-border text-foreground font-mono ${
                            !inputValidation.valid && tc.input.trim()
                              ? 'border-destructive focus:ring-destructive'
                              : ''
                          }`}
                          required
                        />
                        {!inputValidation.valid && tc.input.trim() && (
                          <p className="text-xs text-destructive">
                            {inputValidation.error}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Examples: <code>[1, 2, 3]</code>,{' '}
                          <code>[[2,7], 9]</code>, <code>"text"</code>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-bold">
                          Output (JSON) *
                        </Label>
                        <Input
                          value={tc.output}
                          onChange={(e) =>
                            handleTestCaseChange(
                              tc.id,
                              'output',
                              e.target.value,
                            )
                          }
                          placeholder="e.g., [0,1]"
                          className={`bg-muted border-border text-foreground font-mono ${
                            !outputValidation.valid && tc.output.trim()
                              ? 'border-destructive focus:ring-destructive'
                              : ''
                          }`}
                          required
                        />
                        {!outputValidation.valid && tc.output.trim() && (
                          <p className="text-xs text-destructive">
                            {outputValidation.error}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Examples: <code>[0,1]</code>, <code>true</code>,{' '}
                          <code>"result"</code>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`public-${tc.id}`}
                        checked={tc.isPublic}
                        onChange={(e) =>
                          onUpdateTestCase(tc.id, 'isPublic', e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                      <Label htmlFor={`public-${tc.id}`} className="text-sm">
                        Show as public example
                      </Label>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-extrabold text-foreground">
                Starter Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="javascript-code"
                    className="text-base font-bold text-foreground"
                  >
                    JavaScript Template *
                  </Label>
                  <textarea
                    id="javascript-code"
                    rows={12}
                    value={jsCode}
                    onChange={(e) => onJsCodeChange(e.target.value)}
                    placeholder="/**&#10; * @param {number[]} nums&#10; * @param {number} target&#10; * @return {number[]}&#10; */&#10;function solution(nums, target) {&#10;  &#10;}"
                    className="w-full p-4 bg-muted border border-border rounded-md text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="python-code"
                    className="text-base font-bold text-foreground"
                  >
                    Python Template *
                  </Label>
                  <textarea
                    id="python-code"
                    rows={12}
                    value={pythonCode}
                    onChange={(e) => onPythonCodeChange(e.target.value)}
                    placeholder="from typing import List&#10;&#10;def solution(nums: List[int], target: int) -> List[int]:&#10;    # Write your code here&#10;    pass"
                    className="w-full p-4 bg-muted border border-border rounded-md text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div
            className={`flex gap-4 ${mode === 'edit' ? 'justify-between' : 'justify-end'}`}
          >
            {mode === 'edit' && onDelete && (
              <Button
                type="button"
                variant="destructive"
                className="font-bold px-8"
                size="lg"
                onClick={onDelete}
                disabled={isDeleting || isSubmitting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Problem'}
              </Button>
            )}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="font-bold px-8"
                size="lg"
                onClick={onCancel}
                disabled={isSubmitting || isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="font-bold px-8"
                size="lg"
                disabled={isSubmitting || isDeleting}
              >
                {isSubmitting
                  ? mode === 'create'
                    ? 'Creating...'
                    : 'Updating...'
                  : mode === 'create'
                    ? 'Create Problem'
                    : 'Update Problem'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
