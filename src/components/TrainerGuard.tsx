import { useTrainerStore } from "@/stores/trainerStore";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";

export function TrainerGuard({ children }: { children: React.ReactNode }) {
  const { isTrainerMode, toggleTrainerMode } = useTrainerStore();
  const { user, profile } = useAuthStore();
  const isTrainerAuthorized = !user || profile?.is_trainer === true;

  if (!isTrainerAuthorized) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto p-4 rounded-full bg-destructive/10 w-fit mb-4">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Coach Access Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Only verified coach accounts can access this page.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button variant="ghost" className="w-full" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button variant="link" className="w-full" asChild>
              <a href="/">Return Home</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!isTrainerMode) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto p-4 rounded-full bg-destructive/10 w-fit mb-4">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Coach Mode Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page requires Coach Mode. Enable it to continue.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" onClick={toggleTrainerMode}>
              Enable Coach Mode
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button variant="link" className="w-full" asChild>
              <a href="/">Return Home</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
