import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

const Diary = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [symptomNotes, setSymptomNotes] = useState("");
  const [triggers, setTriggers] = useState("");
  const [medicationTime, setMedicationTime] = useState("");
  const [inhlerUses, setInhalerUses] = useState(0);
  const [severity, setSeverity] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("asthma_diary").upsert({
        user_id: user.id,
        date: format(date, "yyyy-MM-dd"),
        symptom_notes: symptomNotes,
        triggers: triggers,
        medication_time: medicationTime || null,
        inhaler_uses: inhlerUses,
        symptom_severity: severity,
      });

      if (error) throw error;

      toast.success("Diary entry saved successfully!");
      setSymptomNotes("");
      setTriggers("");
      setMedicationTime("");
      setInhalerUses(0);
      setSeverity(5);
    } catch (error: any) {
      toast.error(error.message || "Failed to save diary entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Asthma Diary</h1>
          <p className="text-muted-foreground">Track your symptoms, triggers, and medication</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Log Entry for {format(date, "MMMM d, yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptom Notes</Label>
                  <Textarea
                    id="symptoms"
                    placeholder="Describe any symptoms you experienced today..."
                    value={symptomNotes}
                    onChange={(e) => setSymptomNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="triggers">Triggers</Label>
                  <Input
                    id="triggers"
                    placeholder="e.g., pollen, dust, exercise"
                    value={triggers}
                    onChange={(e) => setTriggers(e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medication">Medication Time</Label>
                    <Input
                      id="medication"
                      type="time"
                      value={medicationTime}
                      onChange={(e) => setMedicationTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uses">Inhaler Uses</Label>
                    <Input
                      id="uses"
                      type="number"
                      min="0"
                      value={inhlerUses}
                      onChange={(e) => setInhalerUses(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Symptom Severity (1-10)</Label>
                  <Input
                    id="severity"
                    type="range"
                    min="1"
                    max="10"
                    value={severity}
                    onChange={(e) => setSeverity(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Mild (1)</span>
                    <span className="font-medium text-foreground">{severity}</span>
                    <span>Severe (10)</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Save Entry"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Diary;
