import { useTrainerStore } from "@/stores/trainerStore";
import { ShieldAlert, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { FormEvent, useMemo, useState } from "react";
import {
  getTrainerAccessConfig,
  isTrainerAccessUnlocked,
  unlockTrainerAccessSession,
} from "@/lib/trainerAccess";

export function TrainerGuard({ children }: { children: React.ReactNode }) {
  const { isTrainerMode, toggleTrainerMode, setTrainerMode } = useTrainerStore();
  const { user } = useAuthStore();
  const trainerAccessConfig = useMemo(() => getTrainerAccessConfig(), []);
  const requiresPasscode = trainerAccessConfig.enabled;
  const isUnlocked = !requiresPasscode || isTrainerAccessUnlocked();
  const [username, setUsername] = useState(user?.email ?? '');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedInput = username.trim().toLowerCase();
    const normalizedExpected = trainerAccessConfig.username?.toLowerCase() ?? '';

    if (
      normalizedInput !== normalizedExpected ||
      passcode !== trainerAccessConfig.passcode
    ) {
      setError('Incorrect trainer username or passcode.');
      return;
    }

    unlockTrainerAccessSession();
    setTrainerMode(true);
    setError(null);
    setPasscode('');
  };

  if (!isTrainerMode && isUnlocked) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto p-4 rounded-full bg-destructive/10 w-fit mb-4">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Trainer Mode Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page is restricted to trainers. Please enable Trainer Mode to access this feature.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" onClick={toggleTrainerMode}>
              Enable Trainer Mode
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

  if (!isUnlocked) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
              <LockKeyhole className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Trainer Access Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center mb-6">
              Enter the temporary trainer username and passcode to unlock trainer pages for this browser session.
            </p>

            <form className="space-y-4" onSubmit={handleUnlock}>
              <div className="space-y-2">
                <Label htmlFor="trainer-username">Username</Label>
                <Input
                  id="trainer-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="trainer username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trainer-passcode">Passcode</Label>
                <Input
                  id="trainer-passcode"
                  type="password"
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                  autoComplete="current-password"
                  placeholder="trainer passcode"
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <Button className="w-full" type="submit">
                Unlock Trainer Access
              </Button>
            </form>
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

  return <>{children}</>;
}
