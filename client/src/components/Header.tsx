import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Menu, Folder, Rss, Users, Archive, Radio, Palette, Settings, Layers, BarChart } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import mailmanLogo from "@assets/mailman-logo.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-[#E8DCC6] border-b-2 border-[#1B365D] px-4 sm:px-6 py-2 sm:py-2.5 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <Link href="/">
          <div className="flex items-center gap-3 sm:gap-4 hover-elevate cursor-pointer rounded-lg px-2 py-1" data-testid="header-logo">
            {/* Logo - Responsive sizing */}
            <img 
              src={mailmanLogo} 
              alt="Mailman Media" 
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md"
            />
            
            {/* Title - Hidden on smallest screens, shown on sm+ */}
            <div className="hidden sm:block">
              <h1 className="text-[#1B365D] font-league-spartan font-black text-lg lg:text-xl uppercase tracking-wide leading-tight">
                Mailman Media
              </h1>
              <p className="text-[#1B365D]/70 font-libre-franklin text-xs lg:text-sm leading-tight">
                The Production Post
              </p>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1.5">
          <Link href="/">
            <Button 
              variant="ghost"
              size="icon" 
              className={`text-[#1B365D] ${location === "/" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
              data-testid="button-home"
            >
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/team-matchup-studio">
            <Button 
              variant="ghost"
              size="icon" 
              className={`text-[#1B365D] ${location === "/team-matchup-studio" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
              data-testid="button-team-matchup"
            >
              <Users className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/live-presentation">
            <Button 
              variant="ghost"
              size="icon" 
              className={`text-[#1B365D] ${location === "/live-presentation" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
              data-testid="button-live-presentation"
            >
              <Radio className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/content-library">
            <Button 
              variant="ghost"
              size="icon" 
              className={`text-[#1B365D] ${location === "/content-library" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
              data-testid="button-content-library"
            >
              <Archive className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/frameworks">
            <Button 
              variant="ghost"
              size="icon" 
              className={`text-[#1B365D] ${location === "/frameworks" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
              data-testid="button-frameworks"
            >
              <Folder className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/rss">
            <Button 
              variant="ghost"
              size="icon" 
              className={`text-[#1B365D] ${location === "/rss" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
              data-testid="button-rss"
            >
              <Rss className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/rss-control">
            <Button 
              variant="ghost"
              size="icon" 
              className={`text-[#1B365D] ${location === "/rss-control" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
              data-testid="button-rss-control"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/templates">
            <Button 
              variant="ghost"
              size="icon" 
              className={`text-[#1B365D] ${location === "/templates" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
              data-testid="button-templates"
            >
              <Palette className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/overlay-templates">
            <Button 
              variant="ghost"
              size="icon" 
              className={`text-[#1B365D] ${location === "/overlay-templates" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
              data-testid="button-overlay-templates"
            >
              <Layers className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/analytics">
            <Button 
              variant="ghost"
              size="icon" 
              className={`text-[#1B365D] ${location === "/analytics" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
              data-testid="button-analytics"
            >
              <BarChart className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="ml-2 pl-2 border-l-2 border-[#1B365D]/20">
            <Badge className="bg-[#C8102E] text-white border-0 font-league-spartan font-semibold uppercase text-xs">
              Live
            </Badge>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleMobileMenu}
            className="text-[#1B365D]"
            data-testid="button-mobile-menu"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pb-3 border-t-2 border-[#1B365D]/20">
          <div className="flex flex-col gap-1.5 pt-3">
            <Link href="/">
              <Button 
                variant="ghost"
                className={`justify-start w-full font-libre-franklin text-[#1B365D] ${location === "/" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
                data-testid="button-home-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5 mr-3" />
                Home
              </Button>
            </Link>
            <Link href="/team-matchup-studio">
              <Button 
                variant="ghost"
                className={`justify-start w-full font-libre-franklin text-[#1B365D] ${location === "/team-matchup-studio" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
                data-testid="button-team-matchup-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="w-5 h-5 mr-3" />
                Team Matchup Studio
              </Button>
            </Link>
            <Link href="/live-presentation">
              <Button 
                variant="ghost"
                className={`justify-start w-full font-libre-franklin text-[#1B365D] ${location === "/live-presentation" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
                data-testid="button-live-presentation-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Radio className="w-5 h-5 mr-3" />
                Live Presentation
              </Button>
            </Link>
            <Link href="/content-library">
              <Button 
                variant="ghost"
                className={`justify-start w-full font-libre-franklin text-[#1B365D] ${location === "/content-library" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
                data-testid="button-content-library-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Archive className="w-5 h-5 mr-3" />
                Content Library
              </Button>
            </Link>
            <Link href="/frameworks">
              <Button 
                variant="ghost"
                className={`justify-start w-full font-libre-franklin text-[#1B365D] ${location === "/frameworks" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
                data-testid="button-frameworks-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Folder className="w-5 h-5 mr-3" />
                Frameworks
              </Button>
            </Link>
            <Link href="/rss">
              <Button 
                variant="ghost"
                className={`justify-start w-full font-libre-franklin text-[#1B365D] ${location === "/rss" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
                data-testid="button-rss-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Rss className="w-5 h-5 mr-3" />
                RSS Intelligence
              </Button>
            </Link>
            <Link href="/rss-control">
              <Button 
                variant="ghost"
                className={`justify-start w-full font-libre-franklin text-[#1B365D] ${location === "/rss-control" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
                data-testid="button-rss-control-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="w-5 h-5 mr-3" />
                RSS Control
              </Button>
            </Link>
            <Link href="/templates">
              <Button 
                variant="ghost"
                className={`justify-start w-full font-libre-franklin text-[#1B365D] ${location === "/templates" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
                data-testid="button-templates-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Palette className="w-5 h-5 mr-3" />
                Templates
              </Button>
            </Link>
            <Link href="/overlay-templates">
              <Button 
                variant="ghost"
                className={`justify-start w-full font-libre-franklin text-[#1B365D] ${location === "/overlay-templates" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
                data-testid="button-overlay-templates-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Layers className="w-5 h-5 mr-3" />
                Overlay Templates
              </Button>
            </Link>
            <Link href="/analytics">
              <Button 
                variant="ghost"
                className={`justify-start w-full font-libre-franklin text-[#1B365D] ${location === "/analytics" ? "bg-[#C8102E]/10 text-[#C8102E]" : ""}`}
                data-testid="button-analytics-mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BarChart className="w-5 h-5 mr-3" />
                Analytics Dashboard
              </Button>
            </Link>
            
            <div className="mt-2 pt-2 border-t-2 border-[#1B365D]/20 flex justify-center">
              <Badge className="bg-[#C8102E] text-white border-0 font-league-spartan font-semibold uppercase text-xs">
                Live Data
              </Badge>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
