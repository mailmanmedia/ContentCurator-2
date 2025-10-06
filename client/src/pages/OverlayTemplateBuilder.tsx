import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Save,
  Copy,
  Trash2,
  Download,
  Upload,
  Palette,
  Type,
  Image as ImageIcon,
  Video,
  Activity,
  Rss,
  Sparkles,
  Eye,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import type { Template } from "@shared/schema";

const LFC_COLORS = {
  Red: '#C8102E',
  Navy: '#002147',
  Gold: '#F6EB61',
  White: '#FFFFFF',
  Black: '#000000',
  Grey: '#6B7280',
};

const FONT_FAMILIES = [
  'League Spartan',
  'Libre Franklin',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Roboto',
  'Open Sans',
];

const METRIC_TYPES = [
  { value: 'h2h-card', label: 'Head-to-Head Card' },
  { value: 'form-guide', label: 'Form Guide' },
  { value: 'player-stats', label: 'Player Statistics' },
  { value: 'league-table', label: 'League Table' },
  { value: 'live-metrics', label: 'Live Metrics' },
  { value: 'live-score', label: 'Live Score' },
];

export default function OverlayTemplateBuilder() {
  const { toast } = useToast();
  const queryClientInstance = useQueryClient();

  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState<'match' | 'stats' | 'analytics' | 'social'>('match');
  const [overlayType, setOverlayType] = useState<'text' | 'image' | 'rss' | 'video' | 'metric'>('text');
  
  const [text, setText] = useState('Sample Overlay Text');
  const [backgroundColor, setBackgroundColor] = useState('#C8102E');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState(28);
  const [fontFamily, setFontFamily] = useState('League Spartan');
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(70);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const [zIndex, setZIndex] = useState(100);
  const [opacity, setOpacity] = useState(0.95);
  const [animationType, setAnimationType] = useState<'scroll' | 'fade' | 'static'>('scroll');
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | 'up' | 'down'>('left');
  const [isBold, setIsBold] = useState(true);
  const [isItalic, setIsItalic] = useState(false);
  const [templateStyle, setTemplateStyle] = useState<'ticker' | 'banner' | 'corner'>('ticker');
  const [metricType, setMetricType] = useState('h2h-card');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  const filteredTemplates = templates.filter(t => 
    t.isActive && (
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      return apiRequest('POST', '/api/templates', templateData);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template Saved",
        description: "Your overlay template has been saved successfully.",
      });
      setIsSaveDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest('PATCH', `/api/templates/${id}`, data);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template Updated",
        description: "Your overlay template has been updated successfully.",
      });
      setSelectedTemplate(null);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template Deleted",
        description: "Template has been deleted successfully.",
      });
      setSelectedTemplate(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setTemplateCategory('match');
    setOverlayType('text');
    setText('Sample Overlay Text');
    setBackgroundColor('#C8102E');
    setTextColor('#FFFFFF');
    setFontSize(28);
    setFontFamily('League Spartan');
    setWidth(100);
    setHeight(70);
    setPosition('bottom');
    setZIndex(100);
    setOpacity(0.95);
    setAnimationType('scroll');
    setScrollSpeed(50);
    setScrollDirection('left');
    setIsBold(true);
    setIsItalic(false);
    setTemplateStyle('ticker');
    setMetricType('h2h-card');
    setImageUrl('');
    setVideoUrl('');
  };

  const loadTemplate = (template: Template) => {
    const styling = template.styling as any;
    const content = template.defaultContent as any;

    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setTemplateCategory(template.category as any);
    setOverlayType(template.templateType as any);
    
    if (styling) {
      setBackgroundColor(styling.backgroundColor || '#C8102E');
      setTextColor(styling.textColor || '#FFFFFF');
      setFontSize(styling.fontSize || 28);
      setFontFamily(styling.fontFamily || 'League Spartan');
      setWidth(styling.width || 100);
      setHeight(styling.height || 70);
      setPosition(styling.position || 'bottom');
      setZIndex(styling.zIndex || 100);
      setOpacity(styling.opacity || 0.95);
      setAnimationType(styling.animationType || 'scroll');
      setScrollSpeed(styling.scrollSpeed || 50);
      setScrollDirection(styling.scrollDirection || 'left');
      setIsBold(styling.isBold ?? true);
      setIsItalic(styling.isItalic ?? false);
      setTemplateStyle(styling.templateStyle || 'ticker');
      setMetricType(styling.metricType || 'h2h-card');
    }

    if (content) {
      setText(content.text || 'Sample Overlay Text');
      setImageUrl(content.imageUrl || '');
      setVideoUrl(content.videoUrl || '');
    }

    setSelectedTemplate(template);
    setIsLoadDialogOpen(false);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a template name.",
        variant: "destructive",
      });
      return;
    }

    const templateData = {
      name: templateName,
      description: templateDescription,
      category: templateCategory,
      templateType: overlayType,
      styling: {
        backgroundColor,
        textColor,
        fontSize,
        fontFamily,
        width,
        height,
        position,
        zIndex,
        opacity,
        animationType,
        scrollSpeed,
        scrollDirection,
        isBold,
        isItalic,
        templateStyle,
        metricType,
      },
      defaultContent: {
        text,
        imageUrl,
        videoUrl,
      },
      isActive: true,
    };

    if (selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, data: templateData });
    } else {
      createTemplateMutation.mutate(templateData);
    }
  };

  const handleDuplicateTemplate = () => {
    if (selectedTemplate) {
      setTemplateName(selectedTemplate.name + ' (Copy)');
      setSelectedTemplate(null);
      toast({
        title: "Template Duplicated",
        description: "Template has been duplicated. You can now edit and save it.",
      });
    }
  };

  const handleExportTemplate = () => {
    const exportData = {
      name: templateName,
      description: templateDescription,
      category: templateCategory,
      templateType: overlayType,
      styling: {
        backgroundColor,
        textColor,
        fontSize,
        fontFamily,
        width,
        height,
        position,
        zIndex,
        opacity,
        animationType,
        scrollSpeed,
        scrollDirection,
        isBold,
        isItalic,
        templateStyle,
        metricType,
      },
      defaultContent: {
        text,
        imageUrl,
        videoUrl,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName || 'overlay-template'}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Template Exported",
      description: "Template JSON has been downloaded.",
    });
  };

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        setTemplateName(importedData.name || '');
        setTemplateDescription(importedData.description || '');
        setTemplateCategory(importedData.category || 'match');
        setOverlayType(importedData.templateType || 'text');
        
        const styling = importedData.styling || {};
        setBackgroundColor(styling.backgroundColor || '#C8102E');
        setTextColor(styling.textColor || '#FFFFFF');
        setFontSize(styling.fontSize || 28);
        setFontFamily(styling.fontFamily || 'League Spartan');
        setWidth(styling.width || 100);
        setHeight(styling.height || 70);
        setPosition(styling.position || 'bottom');
        setZIndex(styling.zIndex || 100);
        setOpacity(styling.opacity || 0.95);
        setAnimationType(styling.animationType || 'scroll');
        setScrollSpeed(styling.scrollSpeed || 50);
        setScrollDirection(styling.scrollDirection || 'left');
        setIsBold(styling.isBold ?? true);
        setIsItalic(styling.isItalic ?? false);
        setTemplateStyle(styling.templateStyle || 'ticker');
        setMetricType(styling.metricType || 'h2h-card');

        const content = importedData.defaultContent || {};
        setText(content.text || 'Sample Overlay Text');
        setImageUrl(content.imageUrl || '');
        setVideoUrl(content.videoUrl || '');

        toast({
          title: "Template Imported",
          description: "Template has been loaded successfully.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid template file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const previewStyle = {
    position: 'absolute' as const,
    [position]: 0,
    left: 0,
    width: `${width}%`,
    height: `${height}px`,
    backgroundColor: backgroundColor,
    color: textColor,
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    fontWeight: isBold ? 'bold' : 'normal',
    fontStyle: isItalic ? 'italic' : 'normal',
    opacity: opacity,
    zIndex: zIndex,
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    overflow: 'hidden',
  };

  return (
    <div className="min-h-screen bg-[#E8DCC6]">
      <Header />
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-league-spartan font-bold text-[#1B365D]">
              Overlay Template Builder
            </h1>
            <p className="text-[#1B365D]/70 font-libre-franklin mt-1">
              Create and manage custom overlay templates
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsLoadDialogOpen(true)}
              variant="outline"
              className="bg-white"
              data-testid="button-load-template"
            >
              <Search className="w-4 h-4 mr-2" />
              Load Template
            </Button>
            <Button
              onClick={() => setIsSaveDialogOpen(true)}
              className="bg-[#C8102E] text-white hover:bg-[#C8102E]/90"
              data-testid="button-save-template"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#1B365D] font-league-spartan">Template Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-[#1B365D]">Overlay Type</Label>
                  <Select value={overlayType} onValueChange={(v: any) => setOverlayType(v)}>
                    <SelectTrigger data-testid="select-overlay-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text"><Type className="w-4 h-4 inline mr-2" />Text</SelectItem>
                      <SelectItem value="image"><ImageIcon className="w-4 h-4 inline mr-2" />Image</SelectItem>
                      <SelectItem value="rss"><Rss className="w-4 h-4 inline mr-2" />RSS Feed</SelectItem>
                      <SelectItem value="video"><Video className="w-4 h-4 inline mr-2" />Video</SelectItem>
                      <SelectItem value="metric"><Activity className="w-4 h-4 inline mr-2" />Metric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {overlayType === 'text' && (
                  <div>
                    <Label className="text-[#1B365D]">Text Content</Label>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Enter overlay text"
                      className="mt-1"
                      data-testid="input-text-content"
                    />
                  </div>
                )}

                {overlayType === 'metric' && (
                  <div>
                    <Label className="text-[#1B365D]">Metric Type</Label>
                    <Select value={metricType} onValueChange={setMetricType}>
                      <SelectTrigger data-testid="select-metric-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METRIC_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#1B365D]">Category</Label>
                    <Select value={templateCategory} onValueChange={(v: any) => setTemplateCategory(v)}>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="match">Match</SelectItem>
                        <SelectItem value="stats">Stats</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[#1B365D]">Template Style</Label>
                    <Select value={templateStyle} onValueChange={(v: any) => setTemplateStyle(v)}>
                      <SelectTrigger data-testid="select-template-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ticker">Ticker</SelectItem>
                        <SelectItem value="banner">Banner</SelectItem>
                        <SelectItem value="corner">Corner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#1B365D]">Background Color</Label>
                    <Select value={backgroundColor} onValueChange={setBackgroundColor}>
                      <SelectTrigger data-testid="select-bg-color">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LFC_COLORS).map(([name, color]) => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                              {name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[#1B365D]">Text Color</Label>
                    <Select value={textColor} onValueChange={setTextColor}>
                      <SelectTrigger data-testid="select-text-color">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LFC_COLORS).map(([name, color]) => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded border" style={{ backgroundColor: color }} />
                              {name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-[#1B365D]">Font Family</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger data-testid="select-font-family">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map(font => (
                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[#1B365D]">Font Size: {fontSize}px</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([v]) => setFontSize(v)}
                    min={12}
                    max={72}
                    step={2}
                    className="mt-2"
                    data-testid="slider-font-size"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isBold}
                      onCheckedChange={setIsBold}
                      data-testid="switch-bold"
                    />
                    <Label className="text-[#1B365D]">Bold</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isItalic}
                      onCheckedChange={setIsItalic}
                      data-testid="switch-italic"
                    />
                    <Label className="text-[#1B365D]">Italic</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#1B365D] font-league-spartan">Layout & Animation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#1B365D]">Width: {width}%</Label>
                    <Slider
                      value={[width]}
                      onValueChange={([v]) => setWidth(v)}
                      min={10}
                      max={100}
                      step={5}
                      className="mt-2"
                      data-testid="slider-width"
                    />
                  </div>
                  <div>
                    <Label className="text-[#1B365D]">Height: {height}px</Label>
                    <Slider
                      value={[height]}
                      onValueChange={([v]) => setHeight(v)}
                      min={40}
                      max={300}
                      step={10}
                      className="mt-2"
                      data-testid="slider-height"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#1B365D]">Position</Label>
                    <Select value={position} onValueChange={(v: any) => setPosition(v)}>
                      <SelectTrigger data-testid="select-position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[#1B365D]">Animation</Label>
                    <Select value={animationType} onValueChange={(v: any) => setAnimationType(v)}>
                      <SelectTrigger data-testid="select-animation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scroll">Scroll</SelectItem>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="static">Static</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {animationType === 'scroll' && (
                  <>
                    <div>
                      <Label className="text-[#1B365D]">Scroll Speed: {scrollSpeed}</Label>
                      <Slider
                        value={[scrollSpeed]}
                        onValueChange={([v]) => setScrollSpeed(v)}
                        min={10}
                        max={100}
                        step={5}
                        className="mt-2"
                        data-testid="slider-scroll-speed"
                      />
                    </div>

                    <div>
                      <Label className="text-[#1B365D]">Scroll Direction</Label>
                      <Select value={scrollDirection} onValueChange={(v: any) => setScrollDirection(v)}>
                        <SelectTrigger data-testid="select-scroll-direction">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                          <SelectItem value="up">Up</SelectItem>
                          <SelectItem value="down">Down</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div>
                  <Label className="text-[#1B365D]">Z-Index: {zIndex}</Label>
                  <Slider
                    value={[zIndex]}
                    onValueChange={([v]) => setZIndex(v)}
                    min={0}
                    max={500}
                    step={10}
                    className="mt-2"
                    data-testid="slider-zindex"
                  />
                </div>

                <div>
                  <Label className="text-[#1B365D]">Opacity: {(opacity * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[opacity * 100]}
                    onValueChange={([v]) => setOpacity(v / 100)}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                    data-testid="slider-opacity"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              {selectedTemplate && (
                <>
                  <Button
                    onClick={handleDuplicateTemplate}
                    variant="outline"
                    className="flex-1 bg-white"
                    data-testid="button-duplicate"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button
                    onClick={() => deleteTemplateMutation.mutate(selectedTemplate.id)}
                    variant="outline"
                    className="flex-1 bg-white text-red-600 hover:bg-red-50"
                    data-testid="button-delete"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
              <Button
                onClick={handleExportTemplate}
                variant="outline"
                className="flex-1 bg-white"
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <label className="flex-1">
                <Button
                  variant="outline"
                  className="w-full bg-white"
                  data-testid="button-import"
                  asChild
                >
                  <div>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </div>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportTemplate}
                  className="hidden"
                  data-testid="input-import-file"
                />
              </label>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#1B365D] font-league-spartan flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <Sparkles className="w-12 h-12 opacity-20" />
                </div>
                <div style={previewStyle}>
                  <span className={animationType === 'scroll' ? 'animate-marquee' : ''}>
                    {overlayType === 'text' && text}
                    {overlayType === 'metric' && `${metricType} Preview`}
                    {overlayType === 'rss' && 'RSS Feed Preview'}
                    {overlayType === 'video' && 'Video Overlay'}
                    {overlayType === 'image' && 'Image Overlay'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#1B365D] font-league-spartan">Save Template</DialogTitle>
            <DialogDescription className="text-[#1B365D]/70">
              Enter a name and description for your overlay template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[#1B365D]">Template Name *</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Breaking News Ticker"
                className="mt-1"
                data-testid="input-template-name"
              />
            </div>
            <div>
              <Label className="text-[#1B365D]">Description</Label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe this template..."
                className="mt-1"
                data-testid="input-template-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
              data-testid="button-cancel-save"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              className="bg-[#C8102E] text-white hover:bg-[#C8102E]/90"
              data-testid="button-confirm-save"
            >
              {selectedTemplate ? 'Update' : 'Save'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogContent className="bg-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#1B365D] font-league-spartan">Load Template</DialogTitle>
            <DialogDescription className="text-[#1B365D]/70">
              Select a template to load into the builder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[#1B365D]">Search Templates</Label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, description, or category..."
                className="mt-1"
                data-testid="input-search-templates"
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredTemplates.length === 0 ? (
                <p className="text-center text-[#1B365D]/50 py-8">No templates found</p>
              ) : (
                filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => loadTemplate(template)}
                    data-testid={`template-card-${template.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-league-spartan font-semibold text-[#1B365D]">
                            {template.name}
                          </h3>
                          {template.description && (
                            <p className="text-sm text-[#1B365D]/70 mt-1">{template.description}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.templateType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
