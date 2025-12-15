'use client';

import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader2 } from 'lucide-react';
import { Difficulty, Verdict, Submission } from '@/types';

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

export default function ProfilePage() {
  const { data: user, isLoading, isError } = useUserProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load profile. Please try logging in again.
      </div>
    );
  }

  const solvedSubmissions =
    user.submissions?.filter(
      (s: Submission) => s.verdict === Verdict.ACCEPTED,
    ) || [];

  const solvedProblemIds = new Set(
    solvedSubmissions.map((s: Submission) => s.problemId),
  );
  const totalSolved = solvedProblemIds.size;

  let easy = 0,
    medium = 0,
    hard = 0;

  const processedProblems = new Set();
  solvedSubmissions.forEach((sub: Submission) => {
    if (sub.problem && !processedProblems.has(sub.problem.id)) {
      processedProblems.add(sub.problem.id);
      if (sub.problem.difficulty === Difficulty.EASY) easy++;
      else if (sub.problem.difficulty === Difficulty.MEDIUM) medium++;
      else if (sub.problem.difficulty === Difficulty.HARD) hard++;
    }
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        <h1 className="text-2xl md:text-4xl font-extrabold text-foreground">
          User Profile
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="lg:col-span-1 bg-card border border-border shadow-lg p-4 md:p-6">
            <CardContent className="p-0 space-y-4 md:space-y-6">
              <div className="flex flex-col items-center text-center space-y-3 md:space-y-4">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/20 flex items-center justify-center border-4 border-background shadow-sm">
                  <span className="text-4xl md:text-5xl font-extrabold text-primary">
                    {user.name
                      ? user.name.charAt(0).toUpperCase()
                      : user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 md:space-y-2">
                  <p className="text-xl md:text-2xl font-extrabold text-foreground">
                    {user.name || 'Anonymous User'}
                  </p>
                  <p className="text-sm md:text-lg text-muted-foreground break-all">
                    {user.email}
                  </p>
                  <span className="inline-block px-2 py-1 bg-muted rounded text-xs text-muted-foreground uppercase font-bold tracking-wider">
                    {user.role}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-card border border-border shadow-lg p-4 md:p-6">
            <CardContent className="p-0">
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4 md:mb-6">
                Statistics
              </h2>
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3">
                  <span className="text-lg md:text-2xl font-bold text-foreground">
                    Total Solved (Unique):
                  </span>
                  <span className="text-3xl md:text-4xl font-extrabold text-primary">
                    {totalSolved}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <div className="bg-muted/50 rounded-lg p-3 md:p-6 text-center space-y-1 md:space-y-2 border border-border/50">
                    <p className="text-xs md:text-sm text-muted-foreground font-bold">
                      Easy
                    </p>
                    <p className="text-2xl md:text-4xl font-extrabold text-green-500">
                      {easy}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 md:p-6 text-center space-y-1 md:space-y-2 border border-border/50">
                    <p className="text-xs md:text-sm text-muted-foreground font-bold">
                      Medium
                    </p>
                    <p className="text-2xl md:text-4xl font-extrabold text-yellow-500">
                      {medium}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 md:p-6 text-center space-y-1 md:space-y-2 border border-border/50">
                    <p className="text-xs md:text-sm text-muted-foreground font-bold">
                      Hard
                    </p>
                    <p className="text-2xl md:text-4xl font-extrabold text-red-500">
                      {hard}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border border-border shadow-lg p-4 md:p-6">
          <CardContent className="p-0">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4 md:mb-6">
              Submission History
            </h2>
            <div className="space-y-3">
              {user.submissions && user.submissions.length > 0 ? (
                user.submissions.map((sub: Submission) => (
                  <Link
                    key={sub.id}
                    href={sub.problem ? `/problems/${sub.problem.slug}` : '#'}
                    className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 p-4 md:p-5 bg-muted/30 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer border border-transparent hover:border-border"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 flex-1">
                      <span className="text-base md:text-lg font-bold text-foreground hover:text-primary transition-colors wrap-break-word">
                        {sub.problem?.title || 'Unknown Problem'}
                      </span>
                      {sub.problem && (
                        <>
                          <span className="hidden sm:inline text-muted-foreground">
                            •
                          </span>
                          <span
                            className={`font-bold text-sm md:text-base ${getDifficultyColor(
                              sub.problem.difficulty,
                            )}`}
                          >
                            {sub.problem.difficulty}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-4">
                      <span
                        className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold ${
                          sub.verdict === Verdict.ACCEPTED
                            ? 'bg-green-500/20 text-green-600'
                            : sub.verdict === Verdict.WRONG_ANSWER
                              ? 'bg-red-500/20 text-red-600'
                              : 'bg-yellow-500/20 text-yellow-600'
                        }`}
                      >
                        {sub.verdict
                          ? sub.verdict.replace(/_/g, ' ')
                          : sub.status}
                      </span>
                      <span className="text-xs md:text-sm text-muted-foreground min-w-20 md:min-w-24 text-right">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-10 text-sm md:text-base text-muted-foreground">
                  No submissions yet. Go solve some problems!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
