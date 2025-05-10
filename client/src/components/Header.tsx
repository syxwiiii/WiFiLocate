import React, { useState } from 'react';
import { Wifi, Filter, User } from 'lucide-react';

interface HeaderProps {
  onToggleFilters: () => void;
}

export function Header({ onToggleFilters }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm py-3 px-4 flex items-center justify-between z-10">
      <div className="flex items-center">
        <div className="text-primary mr-2">
          <Wifi className="h-5 w-5" />
        </div>
        <h1 className="font-heading font-semibold text-lg text-neutral-dark">WiFiLocate</h1>
      </div>
      
      <div className="flex items-center">
        <button
          onClick={onToggleFilters}
          className="mr-2 p-2 rounded-full hover:bg-gray-100"
          aria-label="Filter"
        >
          <Filter className="h-5 w-5 text-neutral-dark" />
        </button>
        
        <button
          className="p-1 rounded-full bg-primary text-white h-8 w-8 flex items-center justify-center"
        >
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
