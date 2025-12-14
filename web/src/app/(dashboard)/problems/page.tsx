'use client';

import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { useProblems } from '@/hooks/useProblems';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Problem, Difficulty, Verdict, Submission } from '@/types';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';
import { useState, useMemo } from 'react';

const getDifficultyColor = (difficulty: Difficulty) => {
  switch (difficulty) {
    case Difficulty.EASY:
      return 'text-green-500';
    case Difficulty.MEDIUM:
      return 'text-yellow-500';
    case Difficulty.HARD:
      return 'text-red-500';
    default:
      return 'text-foreground';
  }
};

export default function ProblemsPage() {
  const {
    data: problems,
    isLoading: isProblemsLoading,
    isError,
  } = useProblems();

  const { data: user } = useUserProfile();

  const [search, setSearch] = useState('');

  const solvedProblemIds = useMemo(() => {
    const ids = new Set<string>();
    if (user && user.submissions) {
      user.submissions.forEach((sub: Submission) => {
        if (sub.verdict === Verdict.ACCEPTED) {
          ids.add(sub.problemId);
        }
      });
    }
    return ids;
  }, [user]);

  const filteredProblems = problems?.filter((p: Problem) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (isProblemsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-8 text-destructive">Failed to load problems.</div>;
  }

  const totalProblems = problems?.length || 0;
  const easyCount =
    problems?.filter((p: Problem) => p.difficulty === Difficulty.EASY).length ||
    0;
  const mediumCount =
    problems?.filter((p: Problem) => p.difficulty === Difficulty.MEDIUM)
      .length || 0;
  const hardCount =
    problems?.filter((p: Problem) => p.difficulty === Difficulty.HARD).length ||
    0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-foreground">
                All Problems
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Browse our collection of algorithmic challenges
              </p>
            </div>
            <Input
              type="search"
              placeholder="Search problems..."
              className="w-80 bg-muted border-border text-foreground text-base h-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-5 shadow-lg">
              <p className="text-sm text-muted-foreground font-bold mb-2">
                Total
              </p>
              <p className="text-3xl font-extrabold text-foreground">
                {totalProblems}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 shadow-lg">
              <p className="text-sm text-muted-foreground font-bold mb-2">
                Easy
              </p>
              <p className="text-3xl font-extrabold text-green-500">
                {easyCount}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 shadow-lg">
              <p className="text-sm text-muted-foreground font-bold mb-2">
                Medium
              </p>
              <p className="text-3xl font-extrabold text-yellow-500">
                {mediumCount}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 shadow-lg">
              <p className="text-sm text-muted-foreground font-bold mb-2">
                Hard
              </p>
              <p className="text-3xl font-extrabold text-red-500">
                {hardCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="border-b border-border hover:bg-muted">
                <TableHead className="p-5 font-extrabold text-foreground text-base w-[50px]">
                  Status
                </TableHead>
                <TableHead className="p-5 font-extrabold text-foreground text-base">
                  Problem Title
                </TableHead>
                <TableHead className="p-5 font-extrabold text-foreground text-base">
                  Difficulty
                </TableHead>
                <TableHead className="p-5 font-extrabold text-foreground text-base">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProblems?.map((problem: Problem) => {
                const isSolved = solvedProblemIds.has(problem.id);

                return (
                  <TableRow
                    key={problem.id}
                    className="border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="p-5">
                      {isSolved ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/30" />
                      )}
                    </TableCell>

                    <TableCell className="p-5">
                      <Link
                        href={`/problems/${problem.slug}`}
                        className="block text-foreground text-lg font-bold hover:text-primary transition-colors"
                      >
                        {problem.title}
                      </Link>
                    </TableCell>

                    <TableCell className="p-5">
                      <span
                        className={`font-extrabold text-base ${getDifficultyColor(
                          problem.difficulty,
                        )}`}
                      >
                        {problem.difficulty}
                      </span>
                    </TableCell>

                    <TableCell className="p-5">
                      <Link href={`/problems/${problem.slug}`}>
                        <span
                          className={`inline-block px-4 py-2 rounded-full text-sm font-extrabold transition-colors ${
                            isSolved
                              ? 'bg-green-500/10 text-green-600 cursor-default'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          {isSolved ? 'Solved' : 'Solve'}
                        </span>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredProblems?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No problems found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
