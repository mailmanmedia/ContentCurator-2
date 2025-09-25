import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Download, Image, Settings } from "lucide-react";
import { useState } from "react";

interface ExportSettings {
  format: 'PNG' | 'JPG' | 'SVG';
  quality: number;
  dimensions: '1920x1080' | '1280x720' | '1600x900' | 'Custom';
  darkMode: boolean;
  watermark: boolean;
}

export default function ExportPanel() {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'PNG',
    quality: 95,
    dimensions: '1920x1080',
    darkMode: true,
    watermark: true
  });
  
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    console.log('Exporting with settings:', settings);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsExporting(false);
    console.log('Export completed');
  };

  const updateSetting = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    console.log(`Updated ${key}:`, value);
  };

  const presetDimensions = [
    { label: 'YouTube Thumbnail (1280x720)', value: '1280x720' },
    { label: 'Full HD (1920x1080)', value: '1920x1080' },
    { label: 'HD+ (1600x900)', value: '1600x900' },
    { label: 'Custom', value: 'Custom' }
  ];

  return (
    <Card className="hover-elevate bg-card border-card-border" data-testid="panel-export">
      <CardHeader>
        <CardTitle className="font-league-spartan font-bold text-lg uppercase tracking-wide text-card-foreground flex items-center gap-2">
          <Image className="w-5 h-5" />
          Export Settings
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div className="space-y-2">
          <label className="font-libre-franklin font-semibold text-sm text-card-foreground">
            Format
          </label>
          <Select 
            value={settings.format} 
            onValueChange={(value: 'PNG' | 'JPG' | 'SVG') => updateSetting('format', value)}
          >
            <SelectTrigger data-testid="select-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PNG">PNG (Recommended)</SelectItem>
              <SelectItem value="JPG">JPG</SelectItem>
              <SelectItem value="SVG">SVG (Vector)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dimensions */}
        <div className="space-y-2">
          <label className="font-libre-franklin font-semibold text-sm text-card-foreground">
            Dimensions
          </label>
          <Select 
            value={settings.dimensions} 
            onValueChange={(value: '1920x1080' | '1280x720' | '1600x900' | 'Custom') => updateSetting('dimensions', value)}
          >
            <SelectTrigger data-testid="select-dimensions">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presetDimensions.map(preset => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quality Slider (for non-SVG formats) */}
        {settings.format !== 'SVG' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-libre-franklin font-semibold text-sm text-card-foreground">
                Quality
              </label>
              <Badge variant="outline" className="font-mono">
                {settings.quality}%
              </Badge>
            </div>
            <Slider
              value={[settings.quality]}
              onValueChange={([value]) => updateSetting('quality', value)}
              min={50}
              max={100}
              step={5}
              className="w-full"
              data-testid="slider-quality"
            />
          </div>
        )}

        {/* Toggle Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-libre-franklin font-semibold text-sm text-card-foreground">
              Dark Mode
            </label>
            <Button
              variant={settings.darkMode ? "default" : "outline"}
              size="sm"
              onClick={() => updateSetting('darkMode', !settings.darkMode)}
              data-testid="toggle-dark-mode"
            >
              {settings.darkMode ? 'ON' : 'OFF'}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="font-libre-franklin font-semibold text-sm text-card-foreground">
              Mailman Watermark
            </label>
            <Button
              variant={settings.watermark ? "default" : "outline"}
              size="sm"
              onClick={() => updateSetting('watermark', !settings.watermark)}
              data-testid="toggle-watermark"
            >
              {settings.watermark ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>

        {/* Export Preview Info */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <h4 className="font-league-spartan font-bold text-sm uppercase text-card-foreground">
            Export Preview
          </h4>
          <div className="text-sm font-libre-franklin text-muted-foreground space-y-1">
            <div>Format: {settings.format}</div>
            <div>Size: {settings.dimensions}</div>
            {settings.format !== 'SVG' && <div>Quality: {settings.quality}%</div>}
            <div>Mode: {settings.darkMode ? 'Dark' : 'Light'}</div>
            <div>Watermark: {settings.watermark ? 'Included' : 'None'}</div>
          </div>
        </div>

        {/* Export Button */}
        <Button 
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
          size="lg"
          data-testid="button-export-download"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export for YouTube'}
        </Button>
        
        {isExporting && (
          <div className="text-center text-sm font-libre-franklin text-muted-foreground">
            Optimizing for YouTube upload...
          </div>
        )}
      </CardContent>
    </Card>
  );
}