import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function AuthCard({
  children,
  title,
  description,
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-foreground">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4 flex flex-col gap-3">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
