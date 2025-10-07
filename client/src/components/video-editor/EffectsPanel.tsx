import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Wand2 } from "lucide-react";
import { useState } from "react";
import type { VideoClip } from "@shared/schema";

interface EffectsPanelProps {
  clip: VideoClip | null;
  onUpdate: (updates: Partial<VideoClip>) => void;
}

export default function EffectsPanel({ clip, onUpdate }: EffectsPanelProps) {
  const currentEffects = (clip?.effects as any) || {};
  
  const [blur, setBlur] = useState([currentEffects.blur || 0]);
  const [vignette, setVignette] = useState([currentEffects.vignette || 0]);
  const [sharpen, setSharpen] = useState([currentEffects.sharpen || 0]);
  const [filmGrain, setFilmGrain] = useState([currentEffects.filmGrain || 0]);
  const [chromatic, setChromatic] = useState([currentEffects.chromatic || 0]);
  const [stabilization, setStabilization] = useState(currentEffects.stabilization || false);

  const updateEffect = (effectName: string, value: any) => {
    const newEffects = { ...currentEffects, [effectName]: value };
    onUpdate({ effects: newEffects });
  };

  if (!clip) {
    return (
      <Card data-testid="effects-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Visual Effects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a clip to apply effects</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="effects-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Visual Effects
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Blur: {blur[0]}</Label>
          <Slider
            value={blur}
            onValueChange={(v) => {
              setBlur(v);
              updateEffect('blur', v[0]);
            }}
            min={0}
            max={20}
            step={1}
            data-testid="slider-blur"
          />
        </div>

        <div className="space-y-2">
          <Label>Vignette: {vignette[0]}</Label>
          <Slider
            value={vignette}
            onValueChange={(v) => {
              setVignette(v);
              updateEffect('vignette', v[0]);
            }}
            min={0}
            max={100}
            step={5}
            data-testid="slider-vignette"
          />
        </div>

        <div className="space-y-2">
          <Label>Sharpen: {sharpen[0]}</Label>
          <Slider
            value={sharpen}
            onValueChange={(v) => {
              setSharpen(v);
              updateEffect('sharpen', v[0]);
            }}
            min={0}
            max={100}
            step={5}
            data-testid="slider-sharpen"
          />
        </div>

        <div className="space-y-2">
          <Label>Film Grain: {filmGrain[0]}</Label>
          <Slider
            value={filmGrain}
            onValueChange={(v) => {
              setFilmGrain(v);
              updateEffect('filmGrain', v[0]);
            }}
            min={0}
            max={100}
            step={5}
            data-testid="slider-film-grain"
          />
        </div>

        <div className="space-y-2">
          <Label>Chromatic Aberration: {chromatic[0]}</Label>
          <Slider
            value={chromatic}
            onValueChange={(v) => {
              setChromatic(v);
              updateEffect('chromatic', v[0]);
            }}
            min={0}
            max={50}
            step={5}
            data-testid="slider-chromatic"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="stabilization"
            checked={stabilization}
            onCheckedChange={(checked) => {
              setStabilization(!!checked);
              updateEffect('stabilization', !!checked);
            }}
            data-testid="checkbox-stabilization"
          />
          <Label htmlFor="stabilization">Video Stabilization</Label>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Effect Presets</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="text-xs p-2 border rounded hover-elevate"
              onClick={() => {
                setBlur([0]);
                setVignette([30]);
                setFilmGrain([15]);
                updateEffect('blur', 0);
                updateEffect('vignette', 30);
                updateEffect('filmGrain', 15);
              }}
              data-testid="button-cinematic-preset"
            >
              Cinematic
            </button>
            <button
              className="text-xs p-2 border rounded hover-elevate"
              onClick={() => {
                setSharpen([80]);
                setVignette([0]);
                setFilmGrain([0]);
                updateEffect('sharpen', 80);
                updateEffect('vignette', 0);
                updateEffect('filmGrain', 0);
              }}
              data-testid="button-sharp-preset"
            >
              Sharp
            </button>
            <button
              className="text-xs p-2 border rounded hover-elevate"
              onClick={() => {
                setBlur([3]);
                setVignette([0]);
                setFilmGrain([0]);
                updateEffect('blur', 3);
                updateEffect('vignette', 0);
                updateEffect('filmGrain', 0);
              }}
              data-testid="button-dreamy-preset"
            >
              Dreamy
            </button>
            <button
              className="text-xs p-2 border rounded hover-elevate"
              onClick={() => {
                setBlur([0]);
                setVignette([0]);
                setSharpen([0]);
                setFilmGrain([0]);
                setChromatic([0]);
                updateEffect('blur', 0);
                updateEffect('vignette', 0);
                updateEffect('sharpen', 0);
                updateEffect('filmGrain', 0);
                updateEffect('chromatic', 0);
              }}
              data-testid="button-reset-effects"
            >
              Reset All
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
