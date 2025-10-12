import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { CameraStreamProvider } from "@/contexts/CameraStreamContext";
import { PiPProvider } from "@/contexts/PictureInPictureContext";
import FrameworkDirectory from "@/pages/FrameworkDirectory";
import CreateFramework from "@/pages/CreateFramework";
import RssIntelligence from "@/pages/RssIntelligence";
import RssControl from "@/pages/RssControl";
import TeamMatchupStudio from "@/pages/TeamMatchupStudio";
import ContentLibrary from "@/pages/ContentLibrary";
import LivePresentation from "@/pages/LivePresentation";
import Templates from "@/pages/Templates";
import OverlayTemplateBuilder from "@/pages/OverlayTemplateBuilder";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import VideoEditor from "@/pages/VideoEditor";
import DatabaseStatus from "@/pages/DatabaseStatus";
import TeamFormsList from "@/pages/TeamFormsList";
import AdminDashboard from "@/pages/AdminDashboard";
import DataAudit from "@/pages/DataAudit";
import DataImportExport from "@/pages/DataImportExport";
import MetaAgentDashboard from "@/pages/MetaAgentDashboard";
import VisualAssistant from "@/components/VisualAssistant";
import OverlayTestPage from "@/pages/OverlayTestPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={VisualAssistant} />
      <Route path="/overlay-test" component={OverlayTestPage} />
      <Route path="/meta-agent" component={MetaAgentDashboard} />
      <Route path="/database-status" component={DatabaseStatus} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/data-audit" component={DataAudit} />
      <Route path="/data-admin" component={DataImportExport} />
      <Route path="/frameworks" component={FrameworkDirectory} />
      <Route path="/frameworks/create" component={CreateFramework} />
      <Route path="/rss" component={RssIntelligence} />
      <Route path="/rss-control" component={RssControl} />
      <Route path="/team-matchup-studio" component={TeamMatchupStudio} />
      <Route path="/team-matchup" component={TeamMatchupStudio} />
      <Route path="/content-library" component={ContentLibrary} />
      <Route path="/live-presentation" component={LivePresentation} />
      <Route path="/live" component={LivePresentation} />
      <Route path="/templates" component={Templates} />
      <Route path="/overlay-templates" component={OverlayTemplateBuilder} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route path="/teams-forms" component={TeamFormsList} />
      <Route path="/video-editor" component={VideoEditor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Set dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PiPProvider>
          <CameraStreamProvider>
            <Toaster />
            <Router />
          </CameraStreamProvider>
        </PiPProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;