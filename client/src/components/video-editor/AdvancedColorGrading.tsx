import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette } from "lucide-react";
import type { VideoClip } from "@shared/schema";

interface AdvancedColorGradingProps {
  clip: VideoClip | null;
  onUpdate: (updates: Partial<VideoClip>) => void;
}

export default function AdvancedColorGrading({ clip, onUpdate }: AdvancedColorGradingProps) {
  const currentAdjustments = (clip?.colorAdjustments as any) || {};
  
  // Color Wheels (Shadows, Midtones, Highlights)
  const [shadows, setShadows] = useState({
    hue: currentAdjustments.shadows?.hue || 0,
    saturation: currentAdjustments.shadows?.saturation || 0,
    luminance: currentAdjustments.shadows?.luminance || 0,
  });
  
  const [midtones, setMidtones] = useState({
    hue: currentAdjustments.midtones?.hue || 0,
    saturation: currentAdjustments.midtones?.saturation || 0,
    luminance: currentAdjustments.midtones?.luminance || 0,
  });
  
  const [highlights, setHighlights] = useState({
    hue: currentAdjustments.highlights?.hue || 0,
    saturation: currentAdjustments.highlights?.saturation || 0,
    luminance: currentAdjustments.highlights?.luminance || 0,
  });

  // Curves
  const [exposure, setExposure] = useState([currentAdjustments.exposure || 0]);
  const [gamma, setGamma] = useState([currentAdjustments.gamma || 1]);
  const [lift, setLift] = useState([currentAdjustments.lift || 0]);
  const [gain, setGain] = useState([currentAdjustments.gain || 1]);

  // HSL
  const [hue, setHue] = useState([currentAdjustments.hue || 0]);
  const [saturation, setSaturation] = useState([currentAdjustments.saturation || 0]);
  const [luminance, setLuminance] = useState([currentAdjustments.luminance || 0]);

  const updateAdjustments = (updates: any) => {
    const newAdjustments = { ...currentAdjustments, ...updates };
    onUpdate({ colorAdjustments: newAdjustments });
  };

  if (!clip) {
    return (
      <Card data-testid="advanced-color-grading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Advanced Color Grading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a clip for advanced color grading</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="advanced-color-grading">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Advanced Color Grading
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wheels">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wheels" data-testid="tab-wheels">Wheels</TabsTrigger>
            <TabsTrigger value="curves" data-testid="tab-curves">Curves</TabsTrigger>
            <TabsTrigger value="hsl" data-testid="tab-hsl">HSL</TabsTrigger>
          </TabsList>

          <TabsContent value="wheels" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Shadows</Label>
              <div className="space-y-2">
                <Label className="text-xs">Hue: {shadows.hue}°</Label>
                <Slider
                  value={[shadows.hue]}
                  onValueChange={(v) => {
                    const newShadows = { ...shadows, hue: v[0] };
                    setShadows(newShadows);
                    updateAdjustments({ shadows: newShadows });
                  }}
                  min={-180}
                  max={180}
                  data-testid="slider-shadows-hue"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Saturation: {shadows.saturation}</Label>
                <Slider
                  value={[shadows.saturation]}
                  onValueChange={(v) => {
                    const newShadows = { ...shadows, saturation: v[0] };
                    setShadows(newShadows);
                    updateAdjustments({ shadows: newShadows });
                  }}
                  min={-100}
                  max={100}
                  data-testid="slider-shadows-saturation"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Midtones</Label>
              <div className="space-y-2">
                <Label className="text-xs">Hue: {midtones.hue}°</Label>
                <Slider
                  value={[midtones.hue]}
                  onValueChange={(v) => {
                    const newMidtones = { ...midtones, hue: v[0] };
                    setMidtones(newMidtones);
                    updateAdjustments({ midtones: newMidtones });
                  }}
                  min={-180}
                  max={180}
                  data-testid="slider-midtones-hue"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Saturation: {midtones.saturation}</Label>
                <Slider
                  value={[midtones.saturation]}
                  onValueChange={(v) => {
                    const newMidtones = { ...midtones, saturation: v[0] };
                    setMidtones(newMidtones);
                    updateAdjustments({ midtones: newMidtones });
                  }}
                  min={-100}
                  max={100}
                  data-testid="slider-midtones-saturation"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Highlights</Label>
              <div className="space-y-2">
                <Label className="text-xs">Hue: {highlights.hue}°</Label>
                <Slider
                  value={[highlights.hue]}
                  onValueChange={(v) => {
                    const newHighlights = { ...highlights, hue: v[0] };
                    setHighlights(newHighlights);
                    updateAdjustments({ highlights: newHighlights });
                  }}
                  min={-180}
                  max={180}
                  data-testid="slider-highlights-hue"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Saturation: {highlights.saturation}</Label>
                <Slider
                  value={[highlights.saturation]}
                  onValueChange={(v) => {
                    const newHighlights = { ...highlights, saturation: v[0] };
                    setHighlights(newHighlights);
                    updateAdjustments({ highlights: newHighlights });
                  }}
                  min={-100}
                  max={100}
                  data-testid="slider-highlights-saturation"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="curves" className="space-y-4">
            <div className="space-y-2">
              <Label>Exposure: {exposure[0].toFixed(2)}</Label>
              <Slider
                value={exposure}
                onValueChange={(v) => {
                  setExposure(v);
                  updateAdjustments({ exposure: v[0] });
                }}
                min={-2}
                max={2}
                step={0.1}
                data-testid="slider-exposure"
              />
            </div>

            <div className="space-y-2">
              <Label>Gamma: {gamma[0].toFixed(2)}</Label>
              <Slider
                value={gamma}
                onValueChange={(v) => {
                  setGamma(v);
                  updateAdjustments({ gamma: v[0] });
                }}
                min={0.1}
                max={3}
                step={0.1}
                data-testid="slider-gamma"
              />
            </div>

            <div className="space-y-2">
              <Label>Lift (Shadows): {lift[0].toFixed(2)}</Label>
              <Slider
                value={lift}
                onValueChange={(v) => {
                  setLift(v);
                  updateAdjustments({ lift: v[0] });
                }}
                min={-1}
                max={1}
                step={0.05}
                data-testid="slider-lift"
              />
            </div>

            <div className="space-y-2">
              <Label>Gain (Highlights): {gain[0].toFixed(2)}</Label>
              <Slider
                value={gain}
                onValueChange={(v) => {
                  setGain(v);
                  updateAdjustments({ gain: v[0] });
                }}
                min={0.1}
                max={3}
                step={0.1}
                data-testid="slider-gain"
              />
            </div>
          </TabsContent>

          <TabsContent value="hsl" className="space-y-4">
            <div className="space-y-2">
              <Label>Hue Shift: {hue[0]}°</Label>
              <Slider
                value={hue}
                onValueChange={(v) => {
                  setHue(v);
                  updateAdjustments({ hue: v[0] });
                }}
                min={-180}
                max={180}
                data-testid="slider-hue-shift"
              />
            </div>

            <div className="space-y-2">
              <Label>Saturation: {saturation[0]}</Label>
              <Slider
                value={saturation}
                onValueChange={(v) => {
                  setSaturation(v);
                  updateAdjustments({ saturation: v[0] });
                }}
                min={-100}
                max={100}
                data-testid="slider-saturation-hsl"
              />
            </div>

            <div className="space-y-2">
              <Label>Luminance: {luminance[0]}</Label>
              <Slider
                value={luminance}
                onValueChange={(v) => {
                  setLuminance(v);
                  updateAdjustments({ luminance: v[0] });
                }}
                min={-100}
                max={100}
                data-testid="slider-luminance"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
