import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Settings, Download, Palette, BarChart3 } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [darkMode, setDarkMode] = useState(true);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    console.log('Dark mode toggled:', !darkMode);
  };

  return (
    <header className="bg-sidebar border-b border-sidebar-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-league-spartan font-black text-lg">M</span>
          </div>
          <div>
            <h1 className="text-sidebar-foreground font-league-spartan font-bold text-xl uppercase tracking-wide">Mailman Media</h1>
            <p className="text-sidebar-foreground/70 font-libre-franklin text-sm">Visual Assistant</p>
          </div>
        </div>

        {/* Navigation Tools */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            data-testid="button-templates"
            onClick={() => console.log('Templates clicked')}
          >
            <Palette className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            data-testid="button-analytics"
            onClick={() => console.log('Analytics clicked')}
          >
            <BarChart3 className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            data-testid="button-export"
            onClick={() => console.log('Export clicked')}
          >
            <Download className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            data-testid="button-settings"
            onClick={() => console.log('Settings clicked')}
          >
            <Settings className="w-5 h-5" />
          </Button>
          
          {/* Dark Mode Toggle */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleDarkMode}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            data-testid="button-dark-mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </Button>
          
          {/* Status Badge */}
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            Live Data
          </Badge>
        </div>
      </div>
    </header>
  );
}