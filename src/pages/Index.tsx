import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Heart, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/smart-spacer-hero.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Breathe Better with{" "}
              <span className="text-primary">Smart Spacer</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              The connected inhaler guidance system that helps asthma patients use their inhaler correctly
              and track their respiratory health in real-time.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Get Started
                  <Sparkles className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/practice">
                <Button size="lg" variant="outline" className="gap-2">
                  Practice Breathing
                  <Activity className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
            <img
              src={heroImage}
              alt="Smart Spacer Device"
              className="relative rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Smart Spacer?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advanced technology meets compassionate care to improve inhaler technique and respiratory health.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Monitoring</h3>
              <p className="text-muted-foreground">
                Track inhalation strength, timing, and orientation with precision sensors for perfect technique.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Asthma Diary</h3>
              <p className="text-muted-foreground">
                Log symptoms, triggers, and medication times to share insights with your healthcare provider.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Kid-Friendly Practice</h3>
              <p className="text-muted-foreground">
                Gamified breathing exercises make learning proper inhaler technique fun for children.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Improve Your Asthma Management?
            </h2>
            <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
              Join thousands of patients who have improved their inhaler technique with Smart Spacer.
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary">
                Create Free Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
