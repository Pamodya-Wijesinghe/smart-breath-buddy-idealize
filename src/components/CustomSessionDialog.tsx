import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SessionSettings {
  cycles: number;
  inhaleDuration: number;
  holdDuration: number;
  exhaleDuration: number;
  restDuration: number;
}

interface CustomSessionDialogProps {
  settings: SessionSettings;
  onSettingsChange: (settings: SessionSettings) => void;
}

export const CustomSessionDialog = ({ settings, onSettingsChange }: CustomSessionDialogProps) => {
  const presets = {
    quick: { cycles: 2, inhaleDuration: 3, holdDuration: 5, exhaleDuration: 3, restDuration: 2 },
    standard: { cycles: 3, inhaleDuration: 5, holdDuration: 10, exhaleDuration: 5, restDuration: 3 },
    extended: { cycles: 5, inhaleDuration: 6, holdDuration: 12, exhaleDuration: 6, restDuration: 4 },
  };

  const applyPreset = (preset: SessionSettings) => {
    onSettingsChange(preset);
  };

  const updateSetting = (key: keyof SessionSettings, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const totalDuration = settings.cycles * (settings.inhaleDuration + settings.holdDuration + settings.exhaleDuration + settings.restDuration);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Custom Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Customize Your Practice Session</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Presets */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => applyPreset(presets.quick)}>
                Quick (2 cycles)
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset(presets.standard)}>
                Standard (3 cycles)
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset(presets.extended)}>
                Extended (5 cycles)
              </Button>
            </div>
          </div>

          {/* Cycles */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Number of Cycles</Label>
              <Badge variant="secondary">{settings.cycles} cycles</Badge>
            </div>
            <Slider
              value={[settings.cycles]}
              onValueChange={([value]) => updateSetting('cycles', value)}
              min={1}
              max={10}
              step={1}
            />
          </div>

          {/* Inhale Duration */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Inhale Duration</Label>
              <Badge variant="secondary">{settings.inhaleDuration}s</Badge>
            </div>
            <Slider
              value={[settings.inhaleDuration]}
              onValueChange={([value]) => updateSetting('inhaleDuration', value)}
              min={2}
              max={10}
              step={1}
            />
          </div>

          {/* Hold Duration */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Hold Duration</Label>
              <Badge variant="secondary">{settings.holdDuration}s</Badge>
            </div>
            <Slider
              value={[settings.holdDuration]}
              onValueChange={([value]) => updateSetting('holdDuration', value)}
              min={3}
              max={20}
              step={1}
            />
          </div>

          {/* Exhale Duration */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Exhale Duration</Label>
              <Badge variant="secondary">{settings.exhaleDuration}s</Badge>
            </div>
            <Slider
              value={[settings.exhaleDuration]}
              onValueChange={([value]) => updateSetting('exhaleDuration', value)}
              min={2}
              max={10}
              step={1}
            />
          </div>

          {/* Rest Duration */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Rest Between Cycles</Label>
              <Badge variant="secondary">{settings.restDuration}s</Badge>
            </div>
            <Slider
              value={[settings.restDuration]}
              onValueChange={([value]) => updateSetting('restDuration', value)}
              min={1}
              max={10}
              step={1}
            />
          </div>

          {/* Total Duration */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Total Session Duration</Label>
              <Badge className="text-base">{Math.floor(totalDuration / 60)}m {totalDuration % 60}s</Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
