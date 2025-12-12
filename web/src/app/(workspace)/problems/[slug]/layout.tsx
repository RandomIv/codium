import ProblemHeader from './_components/ProblemHeader';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <ProblemHeader />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
