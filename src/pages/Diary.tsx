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
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  const fetchEntries = async (userId: string) => {
    const { data } = await supabase
      .from('asthma_diary')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (data) setRecentEntries(data);
  };

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
      } else {
        fetchEntries(session.user.id);
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
      fetchEntries(user.id);
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

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No diary entries yet. Start tracking your asthma today!
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEntries.map((entry) => (
                    <div key={entry.id} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-lg">
                          {format(new Date(entry.date), "MMMM d, yyyy")}
                        </div>
                        <div className="text-sm px-2 py-1 bg-background rounded-full border">
                          Severity: {entry.symptom_severity}/10
                        </div>
                      </div>
                      <p className="text-sm text-foreground/80 mb-2">{entry.symptom_notes}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {entry.triggers && <div><span className="font-medium">Triggers:</span> {entry.triggers}</div>}
                        <div><span className="font-medium">Inhaler Uses:</span> {entry.inhaler_uses}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Diary;
