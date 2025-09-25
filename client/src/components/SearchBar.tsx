import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  filters?: string[];
  selectedFilters?: string[];
  onFilterChange?: (filters: string[]) => void;
}

export default function SearchBar({ 
  placeholder = "Search Liverpool FC data, players, matches...", 
  onSearch,
  filters = [],
  selectedFilters = [],
  onFilterChange 
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch?.(query);
    console.log('Search triggered:', query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleFilter = (filter: string) => {
    const newFilters = selectedFilters.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];
    onFilterChange?.(newFilters);
    console.log('Filter toggled:', filter, newFilters);
  };

  const clearFilters = () => {
    onFilterChange?.([]);
    console.log('Filters cleared');
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-20 font-libre-franklin bg-card border-card-border text-card-foreground"
          data-testid="input-search"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
            className="text-muted-foreground hover:text-card-foreground"
            data-testid="button-filter"
          >
            <Filter className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleSearch}
            data-testid="button-search"
          >
            Search
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && filters.length > 0 && (
        <div className="p-4 bg-card border border-card-border rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-league-spartan font-bold text-sm uppercase tracking-wide text-card-foreground">
              Filters
            </h3>
            {selectedFilters.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-destructive"
                data-testid="button-clear-filters"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const isSelected = selectedFilters.includes(filter);
              return (
                <Badge
                  key={filter}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleFilter(filter)}
                  data-testid={`filter-${filter.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {filter}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {selectedFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-libre-franklin text-muted-foreground">Active filters:</span>
          {selectedFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => toggleFilter(filter)}
            >
              {filter}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}