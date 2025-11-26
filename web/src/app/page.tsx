import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
            <Card className="w-[400px] shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Codium 🚀</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        System is ready. Infrastructure is up.
                    </p>
                    <Button className="w-full">
                        Start Coding
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}