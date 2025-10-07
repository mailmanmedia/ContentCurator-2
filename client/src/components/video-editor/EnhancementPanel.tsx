import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Volume2 } from "lucide-react";

interface EnhancementPanelProps {
  onColorChange?: (adjustments: any) => void;
  onAudioChange?: (settings: any) => void;
}

export default function EnhancementPanel({ 
  onColorChange, 
  onAudioChange 
}: EnhancementPanelProps) {
  const [lutPreset, setLutPreset] = useState<string>("");
  const [brightness, setBrightness] = useState([0]);
  const [contrast, setContrast] = useState([0]);
  const [saturation, setSaturation] = useState([0]);
  const [audioEnhancement, setAudioEnhancement] = useState({
    enhance: false,
    noiseReduction: false,
    normalization: false,
    voiceClarity: false
  });

  return (
    <div className="space-y-4">
      <Card data-testid="color-grading-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="w-4 h-4" />
            Color Grading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>LUT Preset</Label>
            <Select value={lutPreset} onValueChange={setLutPreset}>
              <SelectTrigger data-testid="select-lut-preset">
                <SelectValue placeholder="Select a LUT preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lfc_home">Liverpool Home</SelectItem>
                <SelectItem value="lfc_away">Liverpool Away</SelectItem>
                <SelectItem value="cinematic">Cinematic</SelectItem>
                <SelectItem value="sports_broadcast">Sports Broadcast</SelectItem>
                <SelectItem value="social_vibrant">Social Vibrant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Brightness: {brightness[0]}</Label>
              <Slider
                value={brightness}
                onValueChange={setBrightness}
                min={-100}
                max={100}
                step={1}
                data-testid="slider-global-brightness"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Contrast: {contrast[0]}</Label>
              <Slider
                value={contrast}
                onValueChange={setContrast}
                min={-100}
                max={100}
                step={1}
                data-testid="slider-global-contrast"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Saturation: {saturation[0]}</Label>
              <Slider
                value={saturation}
                onValueChange={setSaturation}
                min={-100}
                max={100}
                step={1}
                data-testid="slider-global-saturation"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="live-preview" data-testid="switch-live-preview" />
            <Label htmlFor="live-preview">Live Preview</Label>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="audio-enhancement-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Volume2 className="w-4 h-4" />
            Audio Enhancement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="enhance-audio"
              checked={audioEnhancement.enhance}
              onCheckedChange={(checked) => 
                setAudioEnhancement({ ...audioEnhancement, enhance: !!checked })
              }
              data-testid="checkbox-enhance-audio"
            />
            <Label htmlFor="enhance-audio">Enhance Audio</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="noise-reduction"
              checked={audioEnhancement.noiseReduction}
              onCheckedChange={(checked) => 
                setAudioEnhancement({ ...audioEnhancement, noiseReduction: !!checked })
              }
              data-testid="checkbox-noise-reduction"
            />
            <Label htmlFor="noise-reduction">Noise Reduction</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="normalization"
              checked={audioEnhancement.normalization}
              onCheckedChange={(checked) => 
                setAudioEnhancement({ ...audioEnhancement, normalization: !!checked })
              }
              data-testid="checkbox-normalization"
            />
            <Label htmlFor="normalization">Volume Normalization</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="voice-clarity"
              checked={audioEnhancement.voiceClarity}
              onCheckedChange={(checked) => 
                setAudioEnhancement({ ...audioEnhancement, voiceClarity: !!checked })
              }
              data-testid="checkbox-voice-clarity"
            />
            <Label htmlFor="voice-clarity">Voice Clarity Boost</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
