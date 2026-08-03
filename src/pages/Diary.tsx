import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { CheckCircle, PlusCircle } from "lucide-react";

const getSeverityColor = (s: number) => {
  if (s <= 3) return "text-green-600 bg-green-50 border-green-200";
  if (s <= 6) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-red-600 bg-red-50 border-red-200";
};

const getSeverityLabel = (s: number) => {
  if (s <= 3) return "Mild";
  if (s <= 6) return "Moderate";
  return "Severe";
};

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
  const [isExistingEntry, setIsExistingEntry] = useState(false);

  const fetchEntries = async (userId: string) => {
    const { data } = await supabase
      .from('asthma_diary')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (data) setRecentEntries(data);
    return data || [];
  };

  // When a date is picked, pre-fill form if an entry exists
  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;
    setDate(newDate);

    const existing = recentEntries.find((entry) =>
      isSameDay(new Date(entry.date), newDate)
    );

    if (existing) {
      setSymptomNotes(existing.symptom_notes || "");
      setTriggers(existing.triggers || "");
      setMedicationTime(existing.medication_time || "");
      setInhalerUses(existing.inhaler_uses || 0);
      setSeverity(existing.symptom_severity || 5);
      setIsExistingEntry(true);
    } else {
      setSymptomNotes("");
      setTriggers("");
      setMedicationTime("");
      setInhalerUses(0);
      setSeverity(5);
      setIsExistingEntry(false);
    }
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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        const entries = await fetchEntries(session.user.id);
        // Pre-fill form with today's entry if it exists
        const todayEntry = entries.find((e: any) =>
          isSameDay(new Date(e.date), new Date())
        );
        if (todayEntry) {
          setSymptomNotes(todayEntry.symptom_notes || "");
          setTriggers(todayEntry.triggers || "");
          setMedicationTime(todayEntry.medication_time || "");
          setInhalerUses(todayEntry.inhaler_uses || 0);
          setSeverity(todayEntry.symptom_severity || 5);
          setIsExistingEntry(true);
        }
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
      setIsExistingEntry(true);
      fetchEntries(user.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to save diary entry");
    } finally {
      setLoading(false);
    }
  };

  // Dates that have diary entries (to highlight on calendar)
  const markedDates = recentEntries.map((e) => new Date(e.date));

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
                onSelect={handleDateSelect}
                className="rounded-md border"
                modifiers={{ hasEntry: markedDates }}
                modifiersStyles={{
                  hasEntry: {
                    fontWeight: "bold",
                    textDecoration: "underline",
                    color: "hsl(var(--primary))",
                  },
                }}
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                <span className="font-bold text-primary underline">Underlined</span> dates have entries
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isExistingEntry ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <PlusCircle className="h-5 w-5 text-muted-foreground" />
                )}
                {isExistingEntry ? "Entry for " : "New Entry for "}
                {format(date, "MMMM d, yyyy")}
              </CardTitle>
              {isExistingEntry && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ This date has a saved entry — you can update it below
                </p>
              )}
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
                  {loading ? "Saving..." : isExistingEntry ? "Update Entry" : "Save Entry"}
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
                    <div
                      key={entry.id}
                      className="p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors border border-transparent hover:border-border"
                      onClick={() => handleDateSelect(new Date(entry.date))}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-lg">
                          {format(new Date(entry.date), "MMMM d, yyyy")}
                        </div>
                        <div className={`text-sm px-2 py-1 rounded-full border font-medium ${getSeverityColor(entry.symptom_severity)}`}>
                          {getSeverityLabel(entry.symptom_severity)} — {entry.symptom_severity}/10
                        </div>
                      </div>
                      <p className="text-sm text-foreground/80 mb-2">{entry.symptom_notes}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {entry.triggers && <div><span className="font-medium">Triggers:</span> {entry.triggers}</div>}
                        <div><span className="font-medium">Inhaler Uses:</span> {entry.inhaler_uses}</div>
                        {entry.medication_time && <div><span className="font-medium">Medication:</span> {entry.medication_time}</div>}
                      </div>
                      <p className="text-xs text-primary mt-2 font-medium">Click to load into form →</p>
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
