import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Brain,
  CheckCircle2,
  Film,
  FolderOpen,
  GaugeCircle,
  Lightbulb,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Video as VideoIcon,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/Header";
import RecordingsLibrary from "@/components/video-editor/RecordingsLibrary";
import ProjectsList from "@/components/video-editor/ProjectsList";
import TimelineEditor from "@/components/video-editor/TimelineEditor";
import VideoPreview from "@/components/video-editor/VideoPreview";
import ClipProperties from "@/components/video-editor/ClipProperties";
import AutoEditPanel from "@/components/video-editor/AutoEditPanel";
import EnhancementPanel from "@/components/video-editor/EnhancementPanel";
import ExportPanel from "@/components/video-editor/ExportPanel";
import TextOverlayManager from "@/components/video-editor/TextOverlayManager";
import TransitionsPanel from "@/components/video-editor/TransitionsPanel";
import SpeedControlPanel from "@/components/video-editor/SpeedControlPanel";
import EffectsPanel from "@/components/video-editor/EffectsPanel";
import KeyframeEditor from "@/components/video-editor/KeyframeEditor";
import AdvancedColorGrading from "@/components/video-editor/AdvancedColorGrading";
import AudioMixerPanel from "@/components/video-editor/AudioMixerPanel";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Recording, VideoProject, VideoClip } from "@shared/schema";
import type { LucideIcon } from "lucide-react";

export type TemplateGoal =
  | "Product Launch"
  | "Match Highlights"
  | "Fan Engagement"
  | "Training Analysis"
  | "Corporate Update";

export type TemplateAudience =
  | "Global Fans"
  | "Club Members"
  | "Executives"
  | "Sponsors"
  | "Academy Players";

type StoryBeat = {
  id: string;
  label: string;
  suggestedDuration: number;
  aiPrompt: string;
};

type VideoTemplate = {
  id: string;
  name: string;
  description: string;
  goal: TemplateGoal;
  audience: TemplateAudience;
  tone: "Bold" | "Analytical" | "Inspirational" | "Exclusive";
  idealDuration: { min: number; max: number };
  recommendedPlatforms: string[];
  recommendedEffects: string[];
  transitions: string[];
  overlaySystems: string[];
  callToActions: string[];
  storyBeats: StoryBeat[];
  audioTreatment: {
    music: string;
    voiceOver: string;
    spatialMix: string;
  };
};

type EffectPreset = {
  id: string;
  label: string;
  category: "Color" | "Motion" | "Text" | "Audio" | "Stylization" | "Utility";
  description: string;
  intensity: { min: number; max: number; defaultValue: number };
  idealUseCases: string[];
};

type AssistantInsight = {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  recommendedActions: string[];
  estimatedTimeSavings: number;
};

type SmartTool = {
  id: string;
  label: string;
  description: string;
  badge: "AI" | "Pro" | "Beta";
  icon: LucideIcon;
  defaultEnabled: boolean;
  impact: string;
};

type RenderJob = {
  id: string;
  label: string;
  format: string;
  resolution: string;
  progress: number;
  etaSeconds: number;
  preset: string;
  status: "queued" | "rendering" | "complete";
};

type UploadedClip = {
  id: string;
  name: string;
  url: string;
  file?: File;
  duration: number;
  transcriptSummary: string;
  detectedMoments: Array<{
    label: string;
    timestamp: number;
    confidence: number;
  }>;
  aiNotes: string[];
};

const TEMPLATE_LIBRARY: VideoTemplate[] = [
  {
    id: "champions-hype",
    name: "Champions League Hype Reel",
    description:
      "Explosive social-first edit optimised for global fan excitement before a Champions League knockout fixture.",
    goal: "Fan Engagement",
    audience: "Global Fans",
    tone: "Bold",
    idealDuration: { min: 45, max: 75 },
    recommendedPlatforms: ["Instagram Reels", "TikTok", "YouTube Shorts"],
    recommendedEffects: ["beat-sync", "crest-flare", "speed-ramp"],
    transitions: ["Energy whip", "Glitch swipe", "Flash cut"],
    overlaySystems: ["Countdown timer", "Animated crest lockups", "Live odds ticker"],
    callToActions: ["Set reminders", "Join the watchalong", "Share predictions"],
    storyBeats: [
      {
        id: "hook",
        label: "Explosive opening",
        suggestedDuration: 8,
        aiPrompt:
          "Cut to three most intense highlights synced to the downbeat. Overlay crest animation and countdown timer.",
      },
      {
        id: "star",
        label: "Star power",
        suggestedDuration: 12,
        aiPrompt: "Isolate star players with motion tracking and speed ramp out of frame.",
      },
      {
        id: "tactics",
        label: "Tactical tease",
        suggestedDuration: 15,
        aiPrompt:
          "Use freeze frames and telestration overlays to spotlight the key tactical battle.",
      },
      {
        id: "call",
        label: "Call to action",
        suggestedDuration: 6,
        aiPrompt: "Animate bold CTA encouraging viewers to share predictions and join the live stream.",
      },
    ],
    audioTreatment: {
      music: "High-energy trap with crowd beds",
      voiceOver: "Dynamic hype voice track",
      spatialMix: "Stereo widen on beat hits",
    },
  },
  {
    id: "tactical-breakdown",
    name: "Premier League Tactical Breakdown",
    description:
      "Deep-dive analysis with telestration, heat maps, and AI-assisted coaching commentary for technical audiences.",
    goal: "Training Analysis",
    audience: "Academy Players",
    tone: "Analytical",
    idealDuration: { min: 180, max: 240 },
    recommendedPlatforms: ["YouTube", "Internal coaching hub"],
    recommendedEffects: ["freeze-frame", "heatmap", "callout-lower-third"],
    transitions: ["Clean dissolve", "Zoom to board"],
    overlaySystems: ["Tactical board", "Player trails", "Spatial heat maps"],
    callToActions: ["Download full session", "Review opponent patterns"],
    storyBeats: [
      {
        id: "setup",
        label: "Match context",
        suggestedDuration: 20,
        aiPrompt: "Summarise fixture state, formations, and match stakes with animated formation overlay.",
      },
      {
        id: "phase",
        label: "Phase analysis",
        suggestedDuration: 120,
        aiPrompt:
          "Auto-tag pressing triggers and passing lanes. Slow down to 60% for coaching clarity.",
      },
      {
        id: "coaching",
        label: "Coaching tips",
        suggestedDuration: 50,
        aiPrompt: "Overlay bullet-point coaching notes and comparisons to training patterns.",
      },
      {
        id: "action",
        label: "Action plan",
        suggestedDuration: 30,
        aiPrompt: "Summarise adjustments and link to training drill references with QR lower third.",
      },
    ],
    audioTreatment: {
      music: "Low bed atmospheric",
      voiceOver: "Analytical coach commentary",
      spatialMix: "Mono voice anchored centre with subtle stadium bed",
    },
  },
  {
    id: "sponsor-wrap",
    name: "Sponsor Match Wrap",
    description:
      "Post-match wrap featuring sponsor storytelling, exclusive camera angles, and branded motion graphics.",
    goal: "Corporate Update",
    audience: "Sponsors",
    tone: "Exclusive",
    idealDuration: { min: 90, max: 140 },
    recommendedPlatforms: ["YouTube", "LinkedIn", "OTT"],
    recommendedEffects: ["golden-grade", "logo-reveal", "caption-suite"],
    transitions: ["Lux fade", "Parallax slide"],
    overlaySystems: ["Branded stats banner", "Split-screen highlights"],
    callToActions: ["Unlock hospitality", "Share with partners"],
    storyBeats: [
      {
        id: "intro",
        label: "Premium welcome",
        suggestedDuration: 12,
        aiPrompt:
          "Blend sponsor animation with cinematic establishing shots. Include tagline lower third.",
      },
      {
        id: "story",
        label: "Story highlights",
        suggestedDuration: 70,
        aiPrompt:
          "Auto-select highlights featuring sponsor product placement and overlay brand metrics.",
      },
      {
        id: "testimonial",
        label: "Partner testimonial",
        suggestedDuration: 30,
        aiPrompt: "Cut sponsor interview with noise reduction and branded frame.",
      },
      {
        id: "cta",
        label: "Relationship CTA",
        suggestedDuration: 18,
        aiPrompt: "Animate premium CTA emphasising next activation and hospitality opportunities.",
      },
    ],
    audioTreatment: {
      music: "Lush cinematic scoring",
      voiceOver: "Polished presenter voice",
      spatialMix: "5.1 ready stems with sponsor sting",
    },
  },
  {
    id: "academy-progress",
    name: "Academy Progress Spotlight",
    description:
      "Narrative recap showing academy development milestones, training clips, and performance metrics.",
    goal: "Training Analysis",
    audience: "Club Members",
    tone: "Inspirational",
    idealDuration: { min: 120, max: 180 },
    recommendedPlatforms: ["YouTube", "Internal intranet"],
    recommendedEffects: ["metric-overlay", "soft-grade", "chapter-intro"],
    transitions: ["Soft push", "Timeline reveal"],
    overlaySystems: ["Progress tracker", "Milestone captions"],
    callToActions: ["Support academy", "Share with families"],
    storyBeats: [
      {
        id: "journey",
        label: "Journey opening",
        suggestedDuration: 20,
        aiPrompt:
          "Montage training footage with inspirational copy generated from player development notes.",
      },
      {
        id: "data",
        label: "Performance data",
        suggestedDuration: 40,
        aiPrompt: "Overlay player metrics and charts with brand palette.",
      },
      {
        id: "personal",
        label: "Player voice",
        suggestedDuration: 30,
        aiPrompt: "Auto-transcribe and highlight key quotes for on-screen captions.",
      },
      {
        id: "outlook",
        label: "Next steps",
        suggestedDuration: 25,
        aiPrompt: "Summarise upcoming fixtures and training focus areas with CTA to academy hub.",
      },
    ],
    audioTreatment: {
      music: "Cinematic uplift",
      voiceOver: "Warm narrator",
      spatialMix: "Stereo with reverb tail for key quotes",
    },
  },
  {
    id: "transfer-announcement",
    name: "Transfer Announcement Cinematic",
    description:
      "High-gloss cinematic reveal blending behind-the-scenes footage, AI rotoscoping, and hero shots.",
    goal: "Product Launch",
    audience: "Global Fans",
    tone: "Bold",
    idealDuration: { min: 60, max: 120 },
    recommendedPlatforms: ["YouTube", "Stadium screens", "Social"],
    recommendedEffects: ["particle-reveal", "hero-grade", "motion-title"],
    transitions: ["Hero flash", "Particle burst"],
    overlaySystems: ["Animated signature", "Stat carousel"],
    callToActions: ["Buy the kit", "Set alerts"],
    storyBeats: [
      {
        id: "tease",
        label: "Mystery tease",
        suggestedDuration: 15,
        aiPrompt:
          "Mask silhouette and reveal details via AI rotoscoping synced to beats.",
      },
      {
        id: "reveal",
        label: "Player reveal",
        suggestedDuration: 20,
        aiPrompt: "Deploy hero-grade LUT and 3D motion title for player introduction.",
      },
      {
        id: "story",
        label: "Story montage",
        suggestedDuration: 25,
        aiPrompt:
          "Auto-curate highlights from legacy club footage and merge with behind-the-scenes capture.",
      },
      {
        id: "cta",
        label: "Merch CTA",
        suggestedDuration: 15,
        aiPrompt: "Motion track new kit details with particle burst into CTA.",
      },
    ],
    audioTreatment: {
      music: "Hybrid orchestral",
      voiceOver: "Narrator with reverb",
      spatialMix: "Immersive surround-ready stems",
    },
  },
];

const EFFECT_PRESETS: EffectPreset[] = [
  {
    id: "beat-sync",
    label: "Beat Sync Speed Ramps",
    category: "Motion",
    description:
      "AI detects percussive hits and automatically generates speed ramps with easing.",
    intensity: { min: 0, max: 100, defaultValue: 70 },
    idealUseCases: ["Hype reels", "Match highlights"],
  },
  {
    id: "crest-flare",
    label: "Crest Lens Flare",
    category: "Stylization",
    description: "Motion-tracked crest reveals with branded lens flares and glow falloff.",
    intensity: { min: 20, max: 100, defaultValue: 60 },
    idealUseCases: ["Club promos", "Transfer teasers"],
  },
  {
    id: "speed-ramp",
    label: "Intelligent Speed Ramp",
    category: "Motion",
    description: "AI analyses motion vectors to ramp speeds without ghosting or artefacts.",
    intensity: { min: 10, max: 100, defaultValue: 50 },
    idealUseCases: ["Highlight reels"],
  },
  {
    id: "freeze-frame",
    label: "Freeze Frame Spotlight",
    category: "Utility",
    description: "Auto-isolates players with matte masks and generates freeze-frame callouts.",
    intensity: { min: 0, max: 100, defaultValue: 45 },
    idealUseCases: ["Tactical analysis", "Coaching"],
  },
  {
    id: "heatmap",
    label: "Dynamic Heat Map",
    category: "Color",
    description: "Applies positional heat overlays generated from tracking data.",
    intensity: { min: 0, max: 100, defaultValue: 65 },
    idealUseCases: ["Training analysis"],
  },
  {
    id: "callout-lower-third",
    label: "Callout Lower Third",
    category: "Text",
    description: "Animated lower thirds with auto-filled stats and data bindings.",
    intensity: { min: 0, max: 100, defaultValue: 55 },
    idealUseCases: ["Analysis", "Sponsorship"],
  },
  {
    id: "golden-grade",
    label: "Golden Sponsor Grade",
    category: "Color",
    description: "Creates premium warm LUT and adaptive vignette for sponsor content.",
    intensity: { min: 0, max: 100, defaultValue: 50 },
    idealUseCases: ["Sponsor wraps", "Corporate"],
  },
  {
    id: "logo-reveal",
    label: "Logo Reveal",
    category: "Stylization",
    description: "Multi-layer 3D extruded crest reveal with camera parallax.",
    intensity: { min: 20, max: 100, defaultValue: 60 },
    idealUseCases: ["Announcements"],
  },
  {
    id: "caption-suite",
    label: "Caption Suite",
    category: "Text",
    description: "Transcribes dialogue and stylises captions with brand typography.",
    intensity: { min: 0, max: 100, defaultValue: 40 },
    idealUseCases: ["Interviews", "Social"],
  },
  {
    id: "metric-overlay",
    label: "Metric Overlay",
    category: "Utility",
    description: "Injects performance charts and progress trackers with live data binding.",
    intensity: { min: 0, max: 100, defaultValue: 65 },
    idealUseCases: ["Academy", "Analysis"],
  },
  {
    id: "particle-reveal",
    label: "Particle Reveal",
    category: "Stylization",
    description: "Procedural particle burst keyed to silhouettes for dramatic reveals.",
    intensity: { min: 0, max: 100, defaultValue: 70 },
    idealUseCases: ["Transfer reveal"],
  },
  {
    id: "hero-grade",
    label: "Hero Grade",
    category: "Color",
    description: "Cinematic LUT with adaptive HDR mapping and halo highlights.",
    intensity: { min: 20, max: 100, defaultValue: 55 },
    idealUseCases: ["Hero content", "Announcements"],
  },
  {
    id: "motion-title",
    label: "Motion Title Suite",
    category: "Text",
    description: "Keyframe-ready animated title packs with AI-generated typography layouts.",
    intensity: { min: 0, max: 100, defaultValue: 50 },
    idealUseCases: ["Announcements", "Promotions"],
  },
];

const SMART_TOOLKIT: SmartTool[] = [
  {
    id: "scene-cut",
    label: "AI Scene Cut",
    description: "Detects camera angle changes and auto-generates edit points across the timeline.",
    badge: "AI",
    icon: Workflow,
    defaultEnabled: true,
    impact: "Reduces manual cutting by 80%",
  },
  {
    id: "object-mask",
    label: "Smart Masking",
    description: "YOLO-powered object isolation with feathered mattes for rotoscoping.",
    badge: "Pro",
    icon: ShieldCheck,
    defaultEnabled: true,
    impact: "Preps VFX plates in minutes",
  },
  {
    id: "audio-polish",
    label: "Voice Polish",
    description: "Noise gating, EQ, and loudness levelling using speech enhancement ML.",
    badge: "AI",
    icon: GaugeCircle,
    defaultEnabled: true,
    impact: "Broadcast-level audio in one click",
  },
  {
    id: "caption-ai",
    label: "Caption AI",
    description: "Transcribes speech, localises captions, and suggests call-to-action overlays.",
    badge: "Beta",
    icon: Sparkles,
    defaultEnabled: false,
    impact: "Localised captions in 60+ languages",
  },
  {
    id: "color-match",
    label: "Color Match",
    description: "Matches grading to selected reference still or LUT with auto-balance.",
    badge: "Pro",
    icon: Palette,
    defaultEnabled: true,
    impact: "Consistent color in seconds",
  },
  {
    id: "story-assist",
    label: "Story Assist",
    description: "Summarises clips and generates beat-by-beat narration suggestions.",
    badge: "AI",
    icon: Brain,
    defaultEnabled: false,
    impact: "Narrative scaffolding from transcripts",
  },
];

const GOAL_OPTIONS: TemplateGoal[] = [
  "Match Highlights",
  "Fan Engagement",
  "Training Analysis",
  "Product Launch",
  "Corporate Update",
];

const AUDIENCE_OPTIONS: TemplateAudience[] = [
  "Global Fans",
  "Club Members",
  "Academy Players",
  "Sponsors",
  "Executives",
];

const formatSeconds = (seconds: number) => {
  if (seconds <= 0) return "Done";
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return minutes > 0 ? `${minutes}m ${rem}s` : `${rem}s`;
};

const summariseTemplate = (template: VideoTemplate) =>
  `${template.goal} • ${template.audience} • ${template.idealDuration.min}-${template.idealDuration.max}s`;

const generateInsights = (
  template: VideoTemplate | null,
  clips: VideoClip[] | undefined,
  effects: string[],
  tools: Record<string, boolean>,
): AssistantInsight[] => {
  if (!template) {
    return [];
  }

  const insights: AssistantInsight[] = [
    {
      id: "structure",
      title: `${template.name} structure locked`,
      summary: `Follow ${template.storyBeats.length} story beats with a ${template.tone.toLowerCase()} tone. Aim for ${template.idealDuration.min}-${template.idealDuration.max} seconds.`,
      confidence: 0.92,
      recommendedActions: template.storyBeats.map((beat) => `Mark ${beat.label} (~${beat.suggestedDuration}s)`),
      estimatedTimeSavings: 24,
    },
    {
      id: "platform",
      title: "Platform optimisation",
      summary: `Optimise aspect ratio and safe zones for ${template.recommendedPlatforms.join(", ")}.`,
      confidence: 0.87,
      recommendedActions: [
        `Export master plus ${template.recommendedPlatforms[0]} variation`,
        `Enable auto-captioning for ${template.callToActions[0]}`,
      ],
      estimatedTimeSavings: 12,
    },
  ];

  if (clips && clips.length > 0) {
    const longest = clips.reduce((prev, curr) => (curr.duration > prev.duration ? curr : prev), clips[0]);
    insights.push({
      id: "clip-intelligence",
      title: "Clip intelligence",
      summary: `Longest clip is ${Math.round(longest.duration)}s – queue AI scene detection to accelerate selects.`,
      confidence: 0.81,
      recommendedActions: [
        "Run AI scene cut on ingest",
        `Use Smart Masking on clip ${longest.id}`,
      ],
      estimatedTimeSavings: 18,
    });
  }

  const enabledTools = Object.entries(tools)
    .filter(([, enabled]) => enabled)
    .map(([id]) => id);

  if (enabledTools.includes("caption-ai")) {
    insights.push({
      id: "caption",
      title: "Caption automation active",
      summary: "Auto captions and CTA overlays are scheduled for render. Review timing before export.",
      confidence: 0.76,
      recommendedActions: ["Approve multilingual captions", "Sync CTA overlays to final beat"],
      estimatedTimeSavings: 9,
    });
  }

  if (effects.length > 0) {
    insights.push({
      id: "effects",
      title: "Effect preset alignment",
      summary: `Effects selected: ${effects.join(", ")}. Calibrate intensities to avoid clashes.`,
      confidence: 0.74,
      recommendedActions: [
        "Preview effect stack at 50% opacity",
        "Lock keyframes before final export",
      ],
      estimatedTimeSavings: 6,
    });
  }

  return insights;
};

export default function VideoEditor() {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("recordings");
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [activeProject, setActiveProject] = useState<VideoProject | null>(null);
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploadedClips, setUploadedClips] = useState<UploadedClip[]>([]);
  const [goal, setGoal] = useState<TemplateGoal>(GOAL_OPTIONS[0]);
  const [audience, setAudience] = useState<TemplateAudience>(AUDIENCE_OPTIONS[0]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATE_LIBRARY[0]?.id ?? "");
  const [selectedEffects, setSelectedEffects] = useState<string[]>(TEMPLATE_LIBRARY[0]?.recommendedEffects ?? []);
  const [toolStates, setToolStates] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    SMART_TOOLKIT.forEach((tool) => {
      initialState[tool.id] = tool.defaultEnabled;
    });
    return initialState;
  });
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([]);

  const { data: clips, refetch: refetchClips } = useQuery<VideoClip[]>({
    queryKey: ["/api/video-projects", activeProject?.id, "clips"],
    enabled: !!activeProject,
  });

  const filteredTemplates = useMemo(() => {
    return TEMPLATE_LIBRARY.filter(
      (template) => template.goal === goal && template.audience === audience,
    );
  }, [goal, audience]);

  useEffect(() => {
    if (filteredTemplates.length === 0) {
      return;
    }

    setSelectedTemplateId((current) => {
      if (current && filteredTemplates.some((template) => template.id === current)) {
        return current;
      }
      return filteredTemplates[0]?.id ?? current;
    });
  }, [filteredTemplates]);

  const selectedTemplate = useMemo(
    () => TEMPLATE_LIBRARY.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId],
  );

  useEffect(() => {
    if (selectedTemplate) {
      setSelectedEffects(selectedTemplate.recommendedEffects);
    }
  }, [selectedTemplate?.id]);

  const assistantInsights = useMemo(
    () => generateInsights(selectedTemplate, clips, selectedEffects, toolStates),
    [selectedTemplate, clips, selectedEffects, toolStates],
  );

  useEffect(() => {
    if (!activeProject || !selectedTemplate) {
      return;
    }

    const queue: RenderJob[] = [
      {
        id: `${activeProject.id}-master`,
        label: "Master Export",
        format: "H.264",
        resolution: "3840x2160",
        progress: 0,
        etaSeconds: 420,
        preset: "ProRes Proxy",
        status: "queued",
      },
      {
        id: `${activeProject.id}-social`,
        label: `${selectedTemplate.recommendedPlatforms[0]} Cut`,
        format: "H.265",
        resolution: "1080x1920",
        progress: 0,
        etaSeconds: 260,
        preset: "Social Vertical",
        status: "queued",
      },
    ];

    setRenderJobs(queue);
  }, [activeProject?.id, selectedTemplate?.id]);

  useEffect(() => {
    if (renderJobs.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setRenderJobs((jobs) =>
        jobs.map((job) => {
          if (job.status === "complete") {
            return job;
          }

          const increment = Math.random() * 18 + 8;
          const nextProgress = Math.min(job.progress + increment, 100);
          return {
            ...job,
            progress: nextProgress,
            status: nextProgress >= 100 ? "complete" : "rendering",
            etaSeconds: nextProgress >= 100 ? 0 : Math.max(job.etaSeconds - Math.round(increment), 0),
          };
        }),
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [renderJobs.length]);

  // FIXED: Proper blob URL cleanup with error handling
  useEffect(() => {
    return () => {
      uploadedClips.forEach((clip) => {
        try {
          // Check if URL exists and is a blob URL
          if (clip.url && typeof clip.url === 'string' && clip.url.startsWith("blob:")) {
            URL.revokeObjectURL(clip.url);
          }
        } catch (error) {
          // URL may have already been revoked or invalid
          console.warn(`Failed to revoke blob URL for clip ${clip.id}:`, error);
        }
      });
    };
  }, [uploadedClips]);

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRecording) throw new Error("No recording selected");

      const res = await apiRequest("POST", "/api/video-projects", {
        name: projectName,
        description: projectDescription,
        recordingId: selectedRecording.id,
        status: "draft",
        templateId: selectedTemplate?.id,
        goal,
        audience,
      });
      return (await res.json()) as VideoProject;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-projects"] });
      setShowCreateDialog(false);
      setProjectName("");
      setProjectDescription("");
      setSelectedRecording(null);
      setActiveProject(project);
      setCurrentTab("edit");
      toast({
        title: "Project created",
        description: `${project.name} is ready with ${selectedTemplate?.name ?? "custom"} blueprint.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const updateClipMutation = useMutation({
    mutationFn: async ({ clipId, updates }: { clipId: string; updates: Partial<VideoClip> }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/video-projects/${activeProject?.id}/clips/${clipId}`,
        updates,
      );
      return await res.json();
    },
    onSuccess: () => {
      refetchClips();
      toast({
        title: "Clip updated",
        description: "Clip adjustments synced with project",
      });
    },
  });

  const deleteClipMutation = useMutation({
    mutationFn: async (clipId: string) => {
      await apiRequest("DELETE", `/api/video-projects/${activeProject?.id}/clips/${clipId}`);
    },
    onSuccess: () => {
      refetchClips();
      setSelectedClip(null);
      toast({
        title: "Clip removed",
        description: "Clip deleted and timeline refreshed",
      });
    },
  });

  const handleCreateProject = (recording: Recording) => {
    setSelectedRecording(recording);
    const defaultName = `${selectedTemplate?.name ?? "Project"} – ${recording.filename}`;
    setProjectName(defaultName);
    setProjectDescription(
      `Goal: ${goal}\nAudience: ${audience}\nTone: ${selectedTemplate?.tone ?? "Custom"}\nRecommended platforms: ${
        selectedTemplate?.recommendedPlatforms.join(", ") ?? ""}
Story beats: ${(selectedTemplate?.storyBeats.length ?? 0).toString()} segments.`,
    );
    setShowCreateDialog(true);
  };

  const handleOpenProject = (project: VideoProject) => {
    setActiveProject(project);
    setCurrentTab("edit");
  };

  const handleClipUpdate = (clipId: string, updates: Partial<VideoClip>) => {
    updateClipMutation.mutate({ clipId, updates });
    setHasUnsavedChanges(true);
  };

  const handleClipDelete = (clipId: string) => {
    const clip = clips?.find(c => c.id === clipId);
    if (!clip) return;

    deleteClipMutation.mutate(clipId);
    setHasUnsavedChanges(true);
  };

  const handleSplitClip = (clipId: string, atTime: number) => {
    const clip = clips?.find(c => c.id === clipId);
    if (!clip) return;

    // Validate split is within clip bounds
    if (atTime <= clip.startTime || atTime >= clip.startTime + clip.duration) {
      toast({
        title: "Invalid Split",
        description: "Split point must be within clip boundaries",
        variant: "destructive"
      });
      return;
    }

    // Minimum clip duration of 0.5 seconds
    const firstClipDuration = atTime - clip.startTime;
    const secondClipDuration = clip.duration - firstClipDuration;
    if (firstClipDuration < 500 || secondClipDuration < 500) {
      toast({
        title: "Invalid Split",
        description: "Resulting clips must be at least 0.5 seconds long",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "AI split scheduled",
      description: `Smart split at ${Math.round(atTime)}s queued for clip ${clipId}.`,
    });
  };

  const handleSaveProject = () => {
    setHasUnsavedChanges(false);
    toast({
      title: "Project saved",
      description: "Adjustments have been persisted",
    });
  };

  const handleDiscardChanges = () => {
    refetchClips();
    setHasUnsavedChanges(false);
    toast({
      title: "Changes discarded",
      description: "Timeline reverted to last saved state",
    });
  };

  const handleUndo = () => {
    toast({
      title: "Undo stack",
      description: "Context-aware undo will roll out with collaborative editing",
    });
  };

  const handleUploadClips = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const staged: UploadedClip[] = Array.from(files).map((file) => ({
      id: `${file.name}-${Date.now()}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      url: URL.createObjectURL(file),
      file,
      duration: Math.round(Math.random() * 180) + 45,
      transcriptSummary: "AI transcript pending – run caption AI to generate script.",
      detectedMoments: [
        { label: "Key moment", timestamp: 12, confidence: 0.78 },
        { label: "Crowd peak", timestamp: 47, confidence: 0.69 },
      ],
      aiNotes: [
        "Stabilise handheld sequence around 00:32",
        "Apply colour match to align with brand LUT",
      ],
    }));

    setUploadedClips((prev) => [...staged, ...prev]);
    toast({
      title: "Upload staged",
      description: `${files.length} clip${files.length > 1 ? "s" : ""} ready for AI analysis`,
    });
  };

  const handleEffectToggle = (effectId: string) => {
    setSelectedEffects((prev) => {
      const exists = prev.includes(effectId);
      const next = exists ? prev.filter((id) => id !== effectId) : [...prev, effectId];
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleToolToggle = (toolId: string) => {
    setToolStates((prev) => {
      const next = { ...prev, [toolId]: !prev[toolId] };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const selectedEffectPresets = useMemo(
    () => selectedEffects.map((id) => EFFECT_PRESETS.find((preset) => preset.id === id)?.label ?? id),
    [selectedEffects],
  );

  const recommendedEffects = useMemo(() => {
    return EFFECT_PRESETS.filter((preset) => selectedEffects.includes(preset.id));
  }, [selectedEffects]);

  const availableEffects = useMemo(() => {
    const selectedSet = new Set(selectedEffects);
    return EFFECT_PRESETS.filter((preset) => !selectedSet.has(preset.id));
  }, [selectedEffects]);

  const activeTools = useMemo(() => Object.entries(toolStates).filter(([, enabled]) => enabled).length, [toolStates]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto space-y-8 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {activeProject && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setActiveProject(null);
                    setCurrentTab("projects");
                    setSelectedClip(null);
                  }}
                  data-testid="button-back"
                >
                  <VideoIcon className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-3xl font-bold">
                {activeProject ? activeProject.name : "Mailman Media Pro Studio"}
              </h1>
            </div>
            <p className="text-muted-foreground">
              Orchestrate uploads, AI-assisted storytelling, and export-ready masters with Mailman Media's
              cinematic toolkit.
            </p>
          </div>

          {activeProject ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleUndo} data-testid="button-undo">
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscardChanges}
                disabled={!hasUnsavedChanges}
                data-testid="button-discard"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSaveProject}
                disabled={!hasUnsavedChanges}
                data-testid="button-save"
              >
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI blueprints ready
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Secure cloud renders
              </div>
            </div>
          )}
        </div>

        {activeProject ? (
          <div className="grid gap-6 xl:grid-cols-[360px,1fr,320px]">
            <div className="space-y-6">
              <Card>
                <CardHeader className="space-y-2">
                  <CardTitle className="flex items-center justify-between text-xl">
                    Creative Blueprint
                    <Badge variant="secondary" className="font-semibold">
                      {selectedTemplate?.tone ?? "Custom"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{selectedTemplate?.description ?? "Custom workflow"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <Target className="h-4 w-4" /> Goal alignment
                    </div>
                    <p className="mt-2 text-muted-foreground">{summariseTemplate(selectedTemplate ?? TEMPLATE_LIBRARY[0])}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedTemplate?.callToActions.map((cta) => (
                        <Badge key={cta} variant="outline">
                          {cta}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Story beats
                    </h3>
                    <div className="space-y-2">
                      {selectedTemplate?.storyBeats.map((beat) => (
                        <div
                          key={beat.id}
                          className="flex items-start justify-between rounded-md border bg-card/60 p-3 text-sm"
                        >
                          <div>
                            <p className="font-medium">{beat.label}</p>
                            <p className="text-muted-foreground">{beat.aiPrompt}</p>
                          </div>
                          <Badge variant="secondary">~{beat.suggestedDuration}s</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Audio treatment
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>Music: {selectedTemplate?.audioTreatment.music}</li>
                      <li>Voiceover: {selectedTemplate?.audioTreatment.voiceOver}</li>
                      <li>Mix: {selectedTemplate?.audioTreatment.spatialMix}</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    AI Production Coach
                    <Brain className="h-5 w-5 text-primary" />
                  </CardTitle>
                  <CardDescription>
                    Intelligent guardrails scanning clips, tool stack, and blueprint to keep edits on brief.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assistantInsights.map((insight) => (
                    <div key={insight.id} className="rounded-lg border bg-muted/40 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{insight.title}</p>
                        <Badge variant="outline">Confidence {Math.round(insight.confidence * 100)}%</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{insight.summary}</p>
                      <ul className="mt-3 space-y-1 text-sm text-primary">
                        {insight.recommendedActions.map((action) => (
                          <li key={action} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-[2px] h-4 w-4" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Estimated time saved: ~{insight.estimatedTimeSavings} mins
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Smart Tool Stack</CardTitle>
                  <CardDescription>
                    {activeTools} of {SMART_TOOLKIT.length} automations active. Toggle to fine-tune assistance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {SMART_TOOLKIT.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <div key={tool.id} className="flex items-start justify-between gap-4 rounded-md border p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <p className="font-medium">{tool.label}</p>
                            <Badge variant="outline" className="uppercase">
                              {tool.badge}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                          <p className="text-xs text-muted-foreground">Impact: {tool.impact}</p>
                        </div>
                        <Switch
                          checked={toolStates[tool.id]}
                          onCheckedChange={() => handleToolToggle(tool.id)}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Render Queue</CardTitle>
                  <CardDescription>Monitor export presets optimised for your blueprint.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderJobs.map((job) => (
                    <div key={job.id} className="space-y-2 rounded-md border p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{job.label}</p>
                          <p className="text-muted-foreground">
                            {job.format} • {job.resolution} • {job.preset}
                          </p>
                        </div>
                        <Badge variant={job.status === "complete" ? "secondary" : "outline"}>
                          {job.status}
                        </Badge>
                      </div>
                      <Progress value={job.progress} />
                      <p className="text-xs text-muted-foreground">
                        ETA: {formatSeconds(job.etaSeconds)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                      Real-time preview with AI effect stack applied. Toggle playback and scrub timeline.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Film className="h-4 w-4" />
                    {selectedEffectPresets.join(" · ")}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <VideoPreview
                    videoUrl={`/api/recordings/${activeProject.recordingId}/video`}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onTimeUpdate={setCurrentTime}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timeline Intelligence</CardTitle>
                  <CardDescription>
                    Multi-track timeline with AI-driven markers, auto transitions, and smart trims.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <TimelineEditor
                    clips={clips || []}
                    currentTime={currentTime}
                    selectedClipId={selectedClip?.id}
                    onTimeChange={setCurrentTime}
                    onClipUpdate={handleClipUpdate}
                    onClipDelete={handleClipDelete}
                    onSplitClip={handleSplitClip}
                    onClipSelect={setSelectedClip}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Effect Rack</CardTitle>
                  <CardDescription>Curate your stack with Mailman-certified presets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Recommended for blueprint
                    </h3>
                    <div className="mt-3 space-y-2">
                      {recommendedEffects.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleEffectToggle(preset.id)}
                          className="w-full rounded-md border bg-primary/5 p-3 text-left text-sm transition hover:bg-primary/10"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{preset.label}</span>
                            <Badge variant="outline">{preset.category}</Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground">{preset.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Explore more presets
                    </h3>
                    <div className="mt-3 grid gap-2">
                      {availableEffects.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleEffectToggle(preset.id)}
                          className="rounded-md border p-3 text-left text-sm transition hover:bg-muted"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{preset.label}</span>
                            <Badge variant="outline">{preset.category}</Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground">{preset.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="clip">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="clip">Clip</TabsTrigger>
                  <TabsTrigger value="effects">Effects</TabsTrigger>
                  <TabsTrigger value="export">Export</TabsTrigger>
                </TabsList>

                <TabsContent value="clip" className="mt-4 space-y-4">
                  <ClipProperties
                    clip={selectedClip}
                    onUpdate={(updates) => selectedClip && handleClipUpdate(selectedClip.id, updates)}
                    onDelete={() => selectedClip && handleClipDelete(selectedClip.id)}
                  />

                  <TransitionsPanel
                    clip={selectedClip}
                    onUpdate={(updates) => selectedClip && handleClipUpdate(selectedClip.id, updates)}
                  />

                  <SpeedControlPanel
                    clip={selectedClip}
                    onUpdate={(updates) => selectedClip && handleClipUpdate(selectedClip.id, updates)}
                  />

                  <KeyframeEditor
                    clipId={selectedClip?.id || null}
                    clipDuration={selectedClip?.duration || 0}
                    currentTime={currentTime}
                  />
                </TabsContent>

                <TabsContent value="effects" className="mt-4 space-y-4">
                  <AutoEditPanel projectId={activeProject.id} />

                  <TextOverlayManager
                    projectId={activeProject.id}
                    currentTime={currentTime}
                    duration={activeProject.duration || 0}
                  />

                  <EffectsPanel
                    clip={selectedClip}
                    onUpdate={(updates) => selectedClip && handleClipUpdate(selectedClip.id, updates)}
                  />

                  <AdvancedColorGrading
                    clip={selectedClip}
                    onUpdate={(updates) => selectedClip && handleClipUpdate(selectedClip.id, updates)}
                  />

                  <EnhancementPanel />

                  <AudioMixerPanel projectId={activeProject.id} />
                </TabsContent>

                <TabsContent value="export" className="mt-4">
                  <ExportPanel projectId={activeProject.id} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Creative Brief</CardTitle>
                  <CardDescription>Define project intent to receive precision AI recommendations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Goal</Label>
                    <Select value={goal} onValueChange={(value: TemplateGoal) => setGoal(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {GOAL_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Audience</Label>
                    <Select value={audience} onValueChange={(value: TemplateAudience) => setAudience(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIENCE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Recommended blueprints</Label>
                    <div className="space-y-3">
                      {filteredTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedTemplateId(template.id)}
                          className={`w-full rounded-lg border p-4 text-left transition ${
                            selectedTemplateId === template.id
                              ? "border-primary bg-primary/10"
                              : "hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold">{template.name}</p>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                            </div>
                            {selectedTemplateId === template.id && (
                              <Badge variant="secondary">Selected</Badge>
                            )}
                          </div>
                          <p className="mt-3 text-xs text-muted-foreground">
                            {summariseTemplate(template)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Upload Footage</CardTitle>
                  <CardDescription>Drag files or browse to ingest footage for AI analysis.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label
                    className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/40 text-center transition hover:border-primary/60"
                  >
                    <Input type="file" accept="video/*" className="hidden" multiple onChange={(event) => handleUploadClips(event.target.files)} />
                    <Upload className="h-8 w-8 text-primary" />
                    <p className="mt-3 font-medium">Drop footage or click to upload</p>
                    <p className="text-sm text-muted-foreground">
                      AI auto-tags highlights, transcripts, and suggested motion graphics.
                    </p>
                  </label>

                  {uploadedClips.length > 0 && (
                    <div className="space-y-3 text-sm">
                      <h3 className="font-semibold">Staged clips</h3>
                      <div className="space-y-2">
                        {uploadedClips.map((clip) => (
                          <div key={clip.id} className="rounded-md border p-3">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{clip.name}</p>
                              <Badge variant="outline">{clip.duration}s</Badge>
                            </div>
                            <p className="text-muted-foreground">{clip.transcriptSummary}</p>
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {clip.aiNotes.map((note) => (
                                <li key={note}>• {note}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Production Playbooks</CardTitle>
                  <CardDescription>
                    Blend Mailman Media templates, AI assistant stacks, and export presets for instant readiness.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3 rounded-md border p-4">
                    <Sparkles className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">AI Storyboard Drafts</p>
                      <p>Generate tailored scripts, VO prompts, and social variants from creative brief inputs.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-md border p-4">
                    <Lightbulb className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Template Alignment</p>
                      <p>
                        Blueprint selection auto-configures transitions, motion presets, and colour treatments per
                        audience.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-md border p-4">
                    <Rocket className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Export Automation</p>
                      <p>
                        Queue masters, social crops, and OTT deliverables with auto-brand compliance and QC checks.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList>
                  <TabsTrigger value="recordings" data-testid="tab-recordings">
                    <VideoIcon className="mr-2 h-4 w-4" /> Recordings
                  </TabsTrigger>
                  <TabsTrigger value="projects" data-testid="tab-projects">
                    <FolderOpen className="mr-2 h-4 w-4" /> Projects
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="recordings" className="mt-6">
                  <RecordingsLibrary onCreateProject={handleCreateProject} />
                </TabsContent>

                <TabsContent value="projects" className="mt-6">
                  <ProjectsList onOpenProject={handleOpenProject} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent data-testid="dialog-create-project">
          <DialogHeader>
            <DialogTitle>Create Video Project</DialogTitle>
            <DialogDescription>Spin up a new production aligned to your Mailman Media blueprint.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Enter project name"
                data-testid="input-project-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Creative Notes</Label>
              <Textarea
                id="project-description"
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                placeholder="Include tone, CTA, or localisation notes"
                data-testid="textarea-project-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={() => createProjectMutation.mutate()}
              disabled={!projectName || createProjectMutation.isPending}
              data-testid="button-create"
            >
              {createProjectMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}