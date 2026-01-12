import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Dumbbell } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="text-center max-w-2xl">
        {/* Floating animated 404 */}
        <div className="mb-8 animate-float">
          <h1 className="text-[10rem] sm:text-[12rem] font-black leading-none mb-0 gradient-text drop-shadow-2xl">
            404
          </h1>

          {/* Animated dumbbells decoration */}
          <div className="flex justify-center gap-4 -mt-8">
            <Dumbbell className="h-12 w-12 text-primary/40 animate-icon-bounce" style={{ animationDelay: '0ms' }} />
            <Dumbbell className="h-12 w-12 text-secondary/40 animate-icon-bounce" style={{ animationDelay: '200ms' }} />
          </div>
        </div>

        {/* Error message */}
        <div className="space-y-3 mb-10">
          <h2 className="text-3xl font-bold">
            Looks Like You've Gone Off-Track
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            This page doesn't exist, or maybe it's resting between sets. Let's get you back on your workout plan!
          </p>
        </div>

        {/* Navigation options */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Link to="/">
            <Button variant="gradient" size="lg" className="gap-2 shadow-glow-pink w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-4">
            Popular destinations:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/wizard">
              <Button variant="ghost" size="sm">
                Create Plan
              </Button>
            </Link>
            <Link to="/circles">
              <Button variant="ghost" size="sm">
                Circles
              </Button>
            </Link>
            <Link to="/exercises">
              <Button variant="ghost" size="sm">
                Exercise Library
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
