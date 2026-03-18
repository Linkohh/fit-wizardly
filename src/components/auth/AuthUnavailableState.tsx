import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthUnavailableStateProps {
  title?: string;
  description?: string;
  secondaryLink?: { to: string; label: string };
}

export function AuthUnavailableState({
  title = "Account Feature Unavailable",
  description = "This feature requires Supabase auth and backend setup. It is not available in demo mode yet. To enable it, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.",
  secondaryLink,
}: AuthUnavailableStateProps) {
  return (
    <main className="container-content py-12">
      <Card className="mx-auto max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-fit rounded-full bg-warning/10 p-4">
            <AlertTriangle className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link to="/">Return Home</Link>
          </Button>
          {secondaryLink && (
            <Button asChild className="w-full" variant="outline">
              <Link to={secondaryLink.to}>{secondaryLink.label}</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
