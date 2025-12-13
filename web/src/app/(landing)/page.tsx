import { Button } from '@/components/ui/button';
import Link from 'next/link';
import BulletPoint from './_components/BulletPoint';
import ParticlesBackground from './_components/ParticlesBackground';

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">
      <ParticlesBackground />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 text-center space-y-16">
        <div className="space-y-6">
          <h1 className="text-6xl font-extrabold text-foreground tracking-tight">
            Code. Compile. Run.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A simple platform to practice your algorithmic skills.
          </p>
          <div className="pt-4">
            <Link href="/problems">
              <Button
                size="lg"
                className="text-lg px-8 py-6 font-bold hover:cursor-pointer hover:ring-5 hover:ring-accent"
              >
                Start Coding
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BulletPoint
            header={'Select a Problem'}
            paragraph={'Choose from a variety of algorithmic challenges'}
          />
          <BulletPoint
            header={'Write your Solution'}
            paragraph={'Code in your preferred language'}
          />
          <BulletPoint
            header={'Get Instant Feedback'}
            paragraph={'Run tests and see results immediately'}
          />
        </div>
      </div>
    </div>
  );
}
