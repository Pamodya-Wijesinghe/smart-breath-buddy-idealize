import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Battery, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { useRealtimeInhalationLogs } from "@/hooks/useRealtimeInhalationLogs";
import { useRealtimeDevice } from "@/hooks/useRealtimeDevice";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const { logs, loading: logsLoading } = useRealtimeInhalationLogs(user?.id);
  const { device, loading: deviceLoading } = useRealtimeDevice(user?.id);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Calculate stats from real-time data
  const todayLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  });

  const perfectTechniques = todayLogs.filter(log => log.result === 'correct').length;
  const techniqueScore = todayLogs.length > 0 
    ? Math.round((perfectTechniques / todayLogs.length) * 100) 
    : 0;

  const getResultLabel = (result: string) => {
    switch (result) {
      case 'correct': return 'Perfect';
      case 'too_fast': return 'Too Fast';
      case 'too_weak': return 'Too Weak';
      case 'wrong_angle': return 'Wrong Angle';
      default: return 'Unknown';
    }
  };

  const getResultColor = (result: string) => {
    return result === 'correct' ? 'text-success' : 'text-warning';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your inhaler usage and respiratory health</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Device Status</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {deviceLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : device ? (
                <>
                  <div className="text-2xl font-bold text-success">Connected</div>
                  <p className="text-xs text-muted-foreground">
                    Last sync: {formatDistanceToNow(new Date(device.last_sync), { addSuffix: true })}
                  </p>
                </>
              ) : (
                <div className="text-2xl font-bold text-muted-foreground">No Device</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Battery Level</CardTitle>
              <Battery className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              {deviceLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : device ? (
                <>
                  <div className="text-2xl font-bold">{device.battery_level}%</div>
                  <Progress value={device.battery_level} className="mt-2" />
                  {device.is_charging && (
                    <p className="text-xs text-success mt-1">Charging...</p>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Usage</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayLogs.length} puffs</div>
              <p className="text-xs text-muted-foreground">
                {perfectTechniques} perfect techniques
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Technique Score</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{techniqueScore}%</div>
              <Progress value={techniqueScore} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Inhalations</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading inhalation logs...
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No inhalation logs yet. Start using your Smart Spacer!
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {log.result === "correct" ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-warning" />
                        )}
                        <div>
                          <div className="font-medium">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </div>
                          <div className={`text-sm ${getResultColor(log.result)}`}>
                            {getResultLabel(log.result)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Strength: {log.inhalation_strength?.toFixed(1)}</div>
                        <div>{log.duration?.toFixed(1)}s</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Breathing Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Inhalation Strength</span>
                    <span className="font-medium">Optimal</span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Timing Accuracy</span>
                    <span className="font-medium">Excellent</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Device Orientation</span>
                    <span className="font-medium">Perfect</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
