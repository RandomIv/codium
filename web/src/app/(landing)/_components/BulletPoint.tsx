import { Card, CardContent } from '@/components/ui/card';

export default function BulletPoint({
  header,
  paragraph,
}: {
  header: string;
  paragraph: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6 space-y-2">
        <h3 className="text-lg font-bold text-foreground">{header}</h3>
        <p className="text-sm text-muted-foreground">{paragraph}</p>
      </CardContent>
    </Card>
  );
}
