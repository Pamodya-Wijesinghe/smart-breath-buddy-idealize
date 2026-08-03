import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Star, CheckCircle2, AlertCircle, SmartphoneCharging, TrendingUp, Calendar, Target, Volume2, VolumeX } from "lucide-react";
import breathingBuddy from "@/assets/breathing-buddy.png";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInhalationLogs } from "@/hooks/useRealtimeInhalationLogs";
import { useRealtimeDevice } from "@/hooks/useRealtimeDevice";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from "date-fns";
import { useVoiceCoach } from "@/hooks/useVoiceCoach";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CustomSessionDialog, SessionSettings } from "@/components/CustomSessionDialog";
import { AgenticCoach } from "@/lib/AgenticCoach";

type BreathingPhase = "ready" | "inhale" | "hold" | "exhale" | "complete" | "rest";

interface BreathingSession {
  id: string;
  date: string;
  result: string;
  score: number;
  inhalation_strength: number;
  inhalation_duration: number;
  holding_time: number;
}

const Practice = () => {
  const [userId, setUserId] = useState<string>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stars, setStars] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>("ready");
  const [currentStep, setCurrentStep] = useState(0);
  const [breathingScale, setBreathingScale] = useState(1);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessions, setSessions] = useState<BreathingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
    cycles: 3,
    inhaleDuration: 5,
    holdDuration: 10,
    exhaleDuration: 5,
    restDuration: 3,
  });

  const { logs } = useRealtimeInhalationLogs(userId);
  const { device } = useRealtimeDevice(userId);
  const { speak, stop: stopVoice, isSpeaking: isVoiceSpeaking, isEnabled: isVoiceEnabled, toggleEnabled: toggleVoice } = useVoiceCoach();
  const [aiCoach, setAiCoach] = useState<AgenticCoach | null>(null);

  useEffect(() => {
    const coach = new AgenticCoach((msg) => speak(msg));
    coach.initialize().then(() => {
      setAiCoach(coach);
    });
  }, [speak]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchSessions();
  }, [userId]);

  const fetchSessions = async () => {
    if (!userId) return;
    
    const thirtyDaysAgo = subDays(new Date(), 30);
    const { data, error } = await supabase
      .from("breathing_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", thirtyDaysAgo.toISOString())
      .order("date", { ascending: true });

    if (!error && data) {
      setSessions(data);
    }
    setLoading(false);
  };

  const steps = [
    { title: "Shake inhaler", description: "Shake your inhaler and attach to spacer" },
    { title: "Exhale", description: "Breathe out completely" },
    { title: "Inhale slowly", description: "Press inhaler and breathe in slowly for 3-5 seconds" },
    { title: "Hold breath", description: "Hold your breath for 10 seconds" },
    { title: "Exhale slowly", description: "Breathe out slowly and relax" }
  ];

  const handleStart = () => {
    // Unlock audio on user gesture to avoid autoplay blocking
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
    } catch {}

    setIsPlaying(true);
    setCurrentStep(0);
    setProgress(0);
    setSessionScore(0);
    setCurrentCycle(0);
    
    if (isVoiceEnabled) {
      speak(`Let's begin your breathing practice. We'll do ${sessionSettings.cycles} breathing cycles together. Get ready.`);
    }
    
    runBreathingSession();
  };

  const runBreathingSession = async () => {
    for (let cycle = 0; cycle < sessionSettings.cycles; cycle++) {
      if (!isPlaying) break;
      
      setCurrentCycle(cycle + 1);
      
      if (isVoiceEnabled && cycle > 0) {
        speak(`Cycle ${cycle + 1} of ${sessionSettings.cycles}`);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      await runSingleCycle(cycle);
      
      // Rest between cycles (except after last cycle)
      if (cycle < sessionSettings.cycles - 1 && isPlaying) {
        setCurrentPhase("rest");
        if (isVoiceEnabled) {
          speak("Good. Take a moment to rest, then we'll continue.");
        }
        await runPhaseWithCountdown(sessionSettings.restDuration * 1000);
      }
    }

    // Complete all cycles
    if (isPlaying) {
      setCurrentPhase("complete");
      setCurrentStep(4);
      setProgress(100);
      setIsPlaying(false);
      setStars((s) => Math.min(s + 1, 5));
      setSessionScore(100);
      
      if (isVoiceEnabled) {
        speak(`Excellent work! You completed all ${sessionSettings.cycles} breathing cycles perfectly. Well done!`);
      }
      
      // Save session
      if (userId) {
        await saveBreathingSession("perfect", "Great job! Perfect breathing technique! 🎉");
        toast.success("Session completed! You earned a star!");
      }
    }
  };

  const runPhaseWithCountdown = async (duration: number) => {
    const startTime = Date.now();
    setCountdown(Math.ceil(duration / 1000));
    
    const countdownInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.ceil((duration - elapsed) / 1000);
      setCountdown(Math.max(0, remaining));
      
      if (elapsed >= duration) {
        clearInterval(countdownInterval);
      }
    }, 100);

    await new Promise(resolve => setTimeout(resolve, duration));
    clearInterval(countdownInterval);
  };

  const runSingleCycle = async (cycleIndex: number) => {
    // Preparation phase 1: Shake inhaler
    if (isVoiceEnabled && cycleIndex === 0) {
      setCurrentStep(0);
      speak("Shake inhaler");
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Preparation phase 2: Breathe out completely
      setCurrentStep(1);
      speak("Breathe out completely");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    const phases: { phase: BreathingPhase; duration: number; scale: number; instruction: string }[] = [
      { phase: "inhale", duration: sessionSettings.inhaleDuration * 1000, scale: 1.4, instruction: `Now press the inhaler and breathe in slowly for ${sessionSettings.inhaleDuration} seconds` },
      { phase: "hold", duration: sessionSettings.holdDuration * 1000, scale: 1.4, instruction: `Hold your breath for ${sessionSettings.holdDuration} seconds` },
      { phase: "exhale", duration: sessionSettings.exhaleDuration * 1000, scale: 1, instruction: "Breathe out slowly and relax" },
    ];

    const totalPhaseDuration = phases.reduce((sum, p) => sum + p.duration, 0);
    const cycleProgressOffset = (cycleIndex / sessionSettings.cycles) * 100;
    const cycleProgressRange = 100 / sessionSettings.cycles;

    for (let i = 0; i < phases.length; i++) {
      if (!isPlaying) break;
      
      const { phase, duration, scale, instruction } = phases[i];
      setCurrentPhase(phase);
      setCurrentStep(i + 2); // +2 because steps 0 and 1 are preparation
      
      // Voice guidance
      if (isVoiceEnabled) {
        speak(instruction);
      }
      
      // Animate breathing scale with countdown
      const startTime = Date.now();
      setCountdown(Math.ceil(duration / 1000));
      
      const animationInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progressPercent = Math.min(elapsed / duration, 1);
        const remaining = Math.ceil((duration - elapsed) / 1000);
        setCountdown(Math.max(0, remaining));
        
        if (phase === "inhale") {
          setBreathingScale(1 + (scale - 1) * progressPercent);
        } else if (phase === "exhale") {
          setBreathingScale(scale - (scale - 1) * progressPercent);
        } else {
          setBreathingScale(scale);
        }
        
        // Calculate overall progress including cycle progress
        const phaseOffset = phases.slice(0, i).reduce((sum, p) => sum + p.duration, 0);
        const currentPhaseProgress = (phaseOffset + elapsed) / totalPhaseDuration;
        const overallProgress = cycleProgressOffset + (currentPhaseProgress * cycleProgressRange);
        setProgress(Math.min(overallProgress, 100));
        
        if (elapsed >= duration) {
          clearInterval(animationInterval);
        }
      }, 100);

      // Trigger AI Agent to analyze dummy sensor data for this phase
      if (aiCoach && isVoiceEnabled) {
        // Generate some dummy sensor data that mimics real performance
        const sensorData = {
          phase,
          targetDuration: duration / 1000,
          currentAngle: Math.floor(Math.random() * 10), // Random angle 0-10 degrees (good)
          inhalationStrength: phase === "inhale" ? "steady" : "none"
        };
        // Occasionally simulate a bad angle or bad strength to trigger correction
        if (Math.random() < 0.2) {
          sensorData.currentAngle = 45; // Bad angle
        }
        
        aiCoach.processSensorData(sensorData);
      }

      await new Promise(resolve => setTimeout(resolve, duration));
      clearInterval(animationInterval);
    }
    
    // Completion message after each cycle
    if (isPlaying && isVoiceEnabled) {
      await new Promise(resolve => setTimeout(resolve, 500));
      speak("Good job, you did it well");
    }
  };

  const saveBreathingSession = async (result: string, feedbackMessage: string) => {
    if (!userId) return;

    const latestLog = logs[0];
    await supabase.from("breathing_sessions").insert({
      user_id: userId,
      inhalation_strength: latestLog?.inhalation_strength || null,
      inhalation_duration: latestLog?.duration || null,
      holding_time: 10,
      orientation_angle: latestLog?.orientation_angle || null,
      result,
      feedback_message: feedbackMessage,
      session_type: "guided",
      score: sessionScore,
    });
    
    // Refresh sessions after saving
    fetchSessions();
  };

  // Analytics calculations
  const getWeeklyData = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return daysOfWeek.map((day) => {
      const daySessions = sessions.filter((s) =>
        isWithinInterval(new Date(s.date), {
          start: day,
          end: new Date(day.getTime() + 24 * 60 * 60 * 1000 - 1),
        })
      );

      const perfectCount = daySessions.filter((s) => s.result === "perfect").length;
      const avgScore = daySessions.length > 0
        ? daySessions.reduce((sum, s) => sum + s.score, 0) / daySessions.length
        : 0;

      return {
        day: format(day, "EEE"),
        sessions: daySessions.length,
        perfectSessions: perfectCount,
        avgScore: Math.round(avgScore),
        date: format(day, "MMM d"),
      };
    });
  };

  const getAccuracyTrend = () => {
    const last14Days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i));

    return last14Days.map((day) => {
      const daySessions = sessions.filter((s) =>
        isWithinInterval(new Date(s.date), {
          start: day,
          end: new Date(day.getTime() + 24 * 60 * 60 * 1000 - 1),
        })
      );

      const perfectRate = daySessions.length > 0
        ? (daySessions.filter((s) => s.result === "perfect").length / daySessions.length) * 100
        : 0;

      return {
        date: format(day, "MM/dd"),
        accuracy: Math.round(perfectRate),
        sessions: daySessions.length,
      };
    });
  };

  const getResultDistribution = () => {
    const resultCounts = sessions.reduce((acc, session) => {
      acc[session.result] = (acc[session.result] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(resultCounts).map(([name, value]) => ({ name, value }));
  };

  const getTechniqueMetrics = () => {
    if (sessions.length === 0) return null;

    const avgStrength = sessions.reduce((sum, s) => sum + (s.inhalation_strength || 0), 0) / sessions.length;
    const avgDuration = sessions.reduce((sum, s) => sum + (s.inhalation_duration || 0), 0) / sessions.length;
    const avgHoldTime = sessions.reduce((sum, s) => sum + (s.holding_time || 0), 0) / sessions.length;
    const completionRate = (sessions.filter(s => s.result === "perfect").length / sessions.length) * 100;

    return {
      avgStrength: avgStrength.toFixed(2),
      avgDuration: avgDuration.toFixed(1),
      avgHoldTime: avgHoldTime.toFixed(1),
      completionRate: completionRate.toFixed(1),
      totalSessions: sessions.length,
    };
  };

  const weeklyData = getWeeklyData();
  const accuracyTrend = getAccuracyTrend();
  const resultDistribution = getResultDistribution();
  const techniqueMetrics = getTechniqueMetrics();

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  const handleReset = () => {
    setProgress(0);
    setIsPlaying(false);
    setCurrentPhase("ready");
    setCurrentStep(0);
    setBreathingScale(1);
    setSessionScore(0);
    setCurrentCycle(0);
    stopVoice();
  };

  const getPhaseInstruction = () => {
    switch (currentPhase) {
      case "ready":
        return "Ready to start your breathing practice?";
      case "inhale":
        return "Breathe in slowly and deeply...";
      case "hold":
        return "Hold your breath... Keep holding...";
      case "exhale":
        return "Now exhale slowly...";
      case "rest":
        return "Rest and relax...";
      case "complete":
        return "Perfect! Great job! 🎉";
      default:
        return "";
    }
  };

  const getOrientationFeedback = () => {
    const latestLog = logs[0];
    if (!latestLog) return null;

    const angle = latestLog.orientation_angle;
    if (Math.abs(angle) > 30) {
      return {
        status: "error",
        message: "Hold inhaler upright!",
        color: "text-destructive"
      };
    } else if (Math.abs(angle) > 15) {
      return {
        status: "warning",
        message: "Adjust angle slightly",
        color: "text-warning"
      };
    }
    return {
      status: "success",
      message: "Perfect angle! ✓",
      color: "text-success"
    };
  };

  const orientationFeedback = getOrientationFeedback();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Breathing Trainer</h1>
              <p className="text-muted-foreground">Master proper breathing and inhaler technique</p>
            </div>
            {device && (
              <Badge variant="outline" className="gap-2">
                {device.is_charging ? (
                  <SmartphoneCharging className="h-4 w-4 text-success" />
                ) : null}
                {device.battery_level}%
              </Badge>
            )}
          </div>
          
          {/* Voice Coach Toggle */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isVoiceEnabled ? (
                    <Volume2 className="h-5 w-5 text-primary" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="voice-coach" className="text-base font-semibold cursor-pointer">
                      Voice Coach
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isVoiceEnabled ? "Voice guidance enabled for hands-free practice" : "Enable voice guidance for audio coaching"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="voice-coach"
                  checked={isVoiceEnabled}
                  onCheckedChange={toggleVoice}
                />
              </div>
              {isVoiceSpeaking && (
                <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                  <div className="animate-pulse">🎙️</div>
                  <span>Speaking...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Step-by-Step Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Guided Training Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      currentStep === index
                        ? "bg-primary/10 border-2 border-primary"
                        : currentStep > index
                        ? "bg-success/5 border border-success/20"
                        : "bg-muted/30 border border-muted"
                    }`}
                  >
                    <div className={`mt-1 ${currentStep >= index ? "text-primary" : "text-muted-foreground"}`}>
                      {currentStep > index ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Practice Area */}
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Breathing Animation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Breathing Buddy Character with Animation */}
              <div className="relative inline-block">
                <div 
                  className="transition-all duration-1000 ease-in-out"
                  style={{
                    transform: `scale(${breathingScale})`,
                  }}
                >
                  <img
                    src={breathingBuddy}
                    alt="Breeze Buddy"
                    className={`w-48 h-48 mx-auto ${
                      currentPhase === "hold" ? "animate-pulse" : ""
                    }`}
                  />
                </div>
                
              {/* Breathing Phase Indicator */}
              {currentPhase !== "ready" && currentPhase !== "complete" && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full">
                  <Badge 
                    variant={currentPhase === "hold" ? "default" : "secondary"}
                    className="text-xs uppercase tracking-wider"
                  >
                    {currentPhase}
                  </Badge>
                </div>
              )}
              
              {/* Countdown Timer */}
              {isPlaying && currentPhase !== "ready" && currentPhase !== "complete" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="flex flex-col items-center gap-2 bg-background/90 rounded-full p-8 shadow-2xl border-4 border-primary">
                    <div className="text-7xl font-bold text-primary">
                      {Math.max(countdown, 0)}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      seconds
                    </div>
                  </div>
                </div>
              )}
            </div>

              {/* Live Instructions */}
              <div className="space-y-2 min-h-[80px]">
                <h3 className="text-xl font-bold">
                  {getPhaseInstruction()}
                </h3>
                {isPlaying && currentCycle > 0 && (
                  <Badge variant="outline" className="mb-2">
                    Cycle {currentCycle} of {sessionSettings.cycles}
                  </Badge>
                )}
                {currentPhase === "inhale" && (
                  <p className="text-sm text-muted-foreground">
                    Breathe in through the spacer slowly and steadily
                  </p>
                )}
                {currentPhase === "hold" && (
                  <p className="text-sm text-muted-foreground">
                    Keep holding... this ensures medication reaches your lungs
                  </p>
                )}
              </div>

              {/* Orientation Feedback */}
              {orientationFeedback && logs.length > 0 && (
                <div className={`flex items-center justify-center gap-2 ${orientationFeedback.color}`}>
                  {orientationFeedback.status === "error" ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  <span className="font-semibold">{orientationFeedback.message}</span>
                  <span className="text-sm text-muted-foreground">
                    (Angle: {logs[0]?.orientation_angle?.toFixed(1)}°)
                  </span>
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <div className="text-sm text-muted-foreground">
                  {Math.round(progress)}% Complete
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-3 items-center">
                <div className="flex gap-2 justify-center">
                  {!isPlaying ? (
                    <Button onClick={handleStart} size="lg" className="gap-2">
                      <Play className="h-4 w-4" />
                      Start Training
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      <Button onClick={() => setIsPlaying(false)} size="lg" variant="secondary" className="gap-2">
                        <Pause className="h-4 w-4" />
                        Pause
                      </Button>
                      <Button onClick={handleReset} variant="outline" className="w-full">
                        Stop Session
                      </Button>
                      <Button 
                        onClick={() => {
                          if (aiCoach) {
                            aiCoach.processSensorData({
                              phase: "inhale",
                              targetDuration: 5,
                              currentAngle: 50, // Bad angle to trigger AI correction
                              inhalationStrength: "too weak"
                            });
                          }
                        }} 
                        variant="secondary" 
                        className="w-full mt-2 bg-blue-100 hover:bg-blue-200 text-blue-800"
                      >
                        Test AI Voice Coach (Simulate Bad Data)
                      </Button>
                    </div>
                  )}
                  {!isPlaying && (
                    <Button onClick={handleReset} size="lg" variant="outline" className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  )}
                </div>
                
                {/* Custom Session Settings */}
                {!isPlaying && (
                  <CustomSessionDialog 
                    settings={sessionSettings}
                    onSettingsChange={setSessionSettings}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Performance */}
          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {logs.slice(0, 3).map((log) => (
                    <div 
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={log.result === "correct" ? "default" : "secondary"}>
                          {log.result}
                        </Badge>
                        <span className="text-sm">{log.feedback_message}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-12 w-12 ${
                      i < stars ? "fill-warning text-warning" : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                You've earned {stars} out of 5 stars today! Keep practicing!
              </p>
            </CardContent>
          </Card>

          {/* Analytics Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="weekly" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="weekly" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          This Week
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {weeklyData.reduce((sum, d) => sum + d.sessions, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Total sessions</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Perfect
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-success">
                          {weeklyData.reduce((sum, d) => sum + d.perfectSessions, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Perfect attempts</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Avg Score
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Math.round(
                            weeklyData.reduce((sum, d) => sum + d.avgScore, 0) / 
                            weeklyData.filter(d => d.sessions > 0).length || 0
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Out of 100</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="day" 
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis 
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="sessions" fill="hsl(var(--primary))" name="Total Sessions" />
                        <Bar dataKey="perfectSessions" fill="hsl(var(--success))" name="Perfect Sessions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="accuracy" className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">14-Day Accuracy Trend</h3>
                    <p className="text-xs text-muted-foreground">
                      Track your breathing technique improvement over the past two weeks
                    </p>
                  </div>

                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={accuracyTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis 
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="accuracy" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Accuracy %"
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {resultDistribution.length > 0 && (
                    <>
                      <div className="space-y-2 mt-6">
                        <h3 className="text-sm font-semibold">Result Distribution</h3>
                        <p className="text-xs text-muted-foreground">
                          Breakdown of your breathing session results
                        </p>
                      </div>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={resultDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="hsl(var(--primary))"
                              dataKey="value"
                            >
                              {resultDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  {techniqueMetrics ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                              Avg Strength
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{techniqueMetrics.avgStrength}</div>
                            <p className="text-xs text-muted-foreground">Flow rate</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                              Avg Duration
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{techniqueMetrics.avgDuration}s</div>
                            <p className="text-xs text-muted-foreground">Inhalation time</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                              Avg Hold Time
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{techniqueMetrics.avgHoldTime}s</div>
                            <p className="text-xs text-muted-foreground">Breath holding</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                              Success Rate
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-success">
                              {techniqueMetrics.completionRate}%
                            </div>
                            <p className="text-xs text-muted-foreground">Perfect sessions</p>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              Overall Performance
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              You've completed <span className="font-bold text-foreground">{techniqueMetrics.totalSessions}</span> breathing sessions 
                              with a <span className="font-bold text-success">{techniqueMetrics.completionRate}%</span> success rate.
                            </p>
                            {parseFloat(techniqueMetrics.completionRate) >= 70 && (
                              <p className="text-sm font-medium text-success">
                                🎉 Excellent progress! Keep up the great work!
                              </p>
                            )}
                            {parseFloat(techniqueMetrics.completionRate) < 70 && parseFloat(techniqueMetrics.completionRate) >= 50 && (
                              <p className="text-sm font-medium text-primary">
                                👍 Good job! Keep practicing to improve your technique.
                              </p>
                            )}
                            {parseFloat(techniqueMetrics.completionRate) < 50 && (
                              <p className="text-sm font-medium text-warning">
                                💪 Keep practicing! Consistency is key to improvement.
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Technique Recommendations</h3>
                        <div className="space-y-2">
                          {parseFloat(techniqueMetrics.avgDuration) < 3 && (
                            <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                              <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                              <div className="text-sm">
                                <span className="font-medium">Slow down your inhalation:</span> Try to breathe in for 3-5 seconds for better medication delivery.
                              </div>
                            </div>
                          )}
                          {parseFloat(techniqueMetrics.avgHoldTime) < 8 && (
                            <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                              <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                              <div className="text-sm">
                                <span className="font-medium">Increase hold time:</span> Hold your breath for at least 10 seconds to allow medication to settle in your lungs.
                              </div>
                            </div>
                          )}
                          {parseFloat(techniqueMetrics.completionRate) >= 80 && (
                            <div className="flex items-start gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                              <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                              <div className="text-sm">
                                <span className="font-medium">Excellent technique!</span> Your breathing pattern is optimal for effective medication delivery.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Complete some breathing sessions to see your technique metrics.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Practice;
