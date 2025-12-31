import { Link } from 'react-router-dom';
import { ArrowRight, Dumbbell, Target, FileText, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  { icon: Target, title: 'Smart Goal Setting', description: 'Choose strength, hypertrophy, or general fitness goals' },
  { icon: Dumbbell, title: 'Equipment Matching', description: 'Plans tailored to your available equipment' },
  { icon: FileText, title: 'PDF Export', description: 'Download and share your personalized plan' },
  { icon: Users, title: 'Trainer Mode', description: 'Manage clients and assign customized plans' },
];

export default function Index() {
  return (
    <main>
      {/* Hero */}
      <section className="py-20 px-4 gradient-subtle">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 border border-primary/20">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Intelligent Workout Planning</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Your Personal <span className="gradient-text">Fitness Wizard</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create safe, personalized workout plans in minutes. Select your goals, equipment, and target muscles — we handle the rest.
          </p>
          <Link to="/wizard">
            <Button variant="gradient" size="xl" className="gap-2 touch-target">
              Start Your Plan <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">How FitWizard Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="text-center hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="pt-6">
                  <div className="mx-auto w-12 h-12 rounded-full gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                    <f.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
