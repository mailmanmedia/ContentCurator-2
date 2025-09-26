import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Settings, Download, Palette, BarChart3, Menu, Sun, Moon, Folder, Home } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
// Import logo - for now we'll use a fallback until we can properly configure the asset import
const mailmanLogo = "/assets/847D1ED6-4A19-4001-B286-53F0D10F961E.png_1758823068354.PNG";

export default function Header() {
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    console.log('Dark mode toggled:', !darkMode);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-sidebar border-b border-sidebar-border px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile: Logo icon only */}
          <div className="sm:hidden">
            <img 
              src={mailmanLogo} 
              alt="Mailman Media" 
              className="w-8 h-8 object-contain"
              data-testid="logo-mobile"
            />
          </div>
          
          {/* Desktop: Full logo with text */}
          <div className="hidden sm:flex items-center gap-4">
            <img 
              src={mailmanLogo} 
              alt="Mailman Media Logo" 
              className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
              data-testid="logo-desktop"
            />
            <div className="hidden md:block">
              <h1 className="text-sidebar-foreground font-league-spartan font-bold text-lg lg:text-xl uppercase tracking-wide">Mailman Media</h1>
              <p className="text-sidebar-foreground/70 font-libre-franklin text-xs lg:text-sm">Visual Assistant</p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-2">
          <Link href="/">
            <Button 
              variant={location === "/" ? "secondary" : "ghost"}
              size="icon" 
              className="text-sidebar-foreground hover:bg-sidebar-accent"
              data-testid="button-home"
            >
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/frameworks">
            <Button 
              variant={location === "/frameworks" ? "secondary" : "ghost"}
              size="icon" 
              className="text-sidebar-foreground hover:bg-sidebar-accent"
              data-testid="button-frameworks"
            >
              <Folder className="w-5 h-5" />
            </Button>
          </Link>
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
            size="icon"
            onClick={toggleDarkMode}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            data-testid="button-dark-mode"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          
          {/* Status Badge */}
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            Live Data
          </Badge>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center gap-2">
          {/* Essential actions for mobile */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleDarkMode}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            data-testid="button-dark-mode-mobile"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          
          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleMobileMenu}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            data-testid="button-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 pb-4 border-t border-sidebar-border">
          <div className="flex flex-col gap-2 pt-4">
            <Link href="/">
              <Button 
                variant={location === "/" ? "secondary" : "ghost"}
                className="justify-start text-sidebar-foreground hover:bg-sidebar-accent w-full"
                data-testid="button-home-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5 mr-3" />
                Home
              </Button>
            </Link>
            <Link href="/frameworks">
              <Button 
                variant={location === "/frameworks" ? "secondary" : "ghost"}
                className="justify-start text-sidebar-foreground hover:bg-sidebar-accent w-full"
                data-testid="button-frameworks-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Folder className="w-5 h-5 mr-3" />
                Framework Directory
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              className="justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              data-testid="button-templates-mobile"
              onClick={() => {
                console.log('Templates clicked');
                setMobileMenuOpen(false);
              }}
            >
              <Palette className="w-5 h-5 mr-3" />
              Templates
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              data-testid="button-analytics-mobile"
              onClick={() => {
                console.log('Analytics clicked');
                setMobileMenuOpen(false);
              }}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              Analytics
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              data-testid="button-export-mobile"
              onClick={() => {
                console.log('Export clicked');
                setMobileMenuOpen(false);
              }}
            >
              <Download className="w-5 h-5 mr-3" />
              Export
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              data-testid="button-settings-mobile"
              onClick={() => {
                console.log('Settings clicked');
                setMobileMenuOpen(false);
              }}
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Button>
            
            <div className="mt-2 pt-2 border-t border-sidebar-border">
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                Live Data
              </Badge>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}