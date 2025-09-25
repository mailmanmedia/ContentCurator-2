import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit } from "lucide-react";
import { useState } from "react";

interface TemplateCardProps {
  title: string;
  category: 'Mailman Monday' | 'Data Dive Wednesday' | 'Future Focus Friday';
  description: string;
  thumbnail: string;
  dimensions: string;
  lastUsed?: string;
}

export default function TemplateCard({ 
  title, 
  category, 
  description, 
  thumbnail, 
  dimensions, 
  lastUsed 
}: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Mailman Monday': return 'bg-primary text-primary-foreground';
      case 'Data Dive Wednesday': return 'bg-chart-5 text-white';
      case 'Future Focus Friday': return 'bg-chart-3 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const handlePreview = () => {
    console.log('Preview template:', title);
  };

  const handleEdit = () => {
    console.log('Edit template:', title);
  };

  return (
    <Card 
      className="hover-elevate transition-all duration-300 bg-card border-card-border"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`card-template-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <Badge className={getCategoryColor(category)}>
            {category}
          </Badge>
          {lastUsed && (
            <span className="text-xs text-muted-foreground font-libre-franklin">
              {lastUsed}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {/* Template Thumbnail */}
        <div className="aspect-video bg-gradient-to-br from-secondary to-muted rounded-md mb-4 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-sidebar/10 opacity-50"></div>
          <span className="text-sidebar-foreground font-league-spartan font-bold text-2xl uppercase tracking-widest opacity-30">
            {category.split(' ')[0]}
          </span>
          
          {/* Hover overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handlePreview}
                data-testid={`button-preview-${title.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-white/90 hover:bg-white"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button 
                size="sm" 
                onClick={handleEdit}
                data-testid={`button-edit-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          )}
        </div>
        
        <h3 className="font-league-spartan font-bold text-lg text-card-foreground uppercase tracking-wide mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground font-libre-franklin text-sm leading-relaxed">
          {description}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground font-libre-franklin">
          <span>{dimensions}</span>
          <span>YouTube Ready</span>
        </div>
      </CardFooter>
    </Card>
  );
}