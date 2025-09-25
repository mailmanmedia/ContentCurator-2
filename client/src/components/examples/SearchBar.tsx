import SearchBar from '../SearchBar';
import { useState } from 'react';

export default function SearchBarExample() {
  // todo: remove mock functionality
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['Players']);
  
  const mockFilters = [
    'Players',
    'Matches',
    'Statistics',
    'Transfers',
    'Injuries',
    'Tactics',
    'Premier League',
    'Champions League',
    'Current Season',
    'Historical Data'
  ];

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  const handleFilterChange = (filters: string[]) => {
    setSelectedFilters(filters);
  };

  return (
    <div className="dark p-6 bg-background">
      <SearchBar 
        filters={mockFilters}
        selectedFilters={selectedFilters}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}