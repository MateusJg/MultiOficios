import React from 'react';
import { 
  Search, 
  Compass, 
  RotateCcw, 
  SlidersHorizontal, 
  LayoutGrid, 
  Columns, 
  Map as MapIcon,
  Check
} from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  radiusKm: number;
  onRadiusChange: (radius: number) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  availableTodayOnly: boolean;
  onToggleAvailableToday: () => void;
  viewMode: 'split' | 'list' | 'map';
  onViewModeChange: (mode: 'split' | 'list' | 'map') => void;
  resultsCount: number;
  onResetFilters: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  radiusKm,
  onRadiusChange,
  sortBy,
  onSortChange,
  availableTodayOnly,
  onToggleAvailableToday,
  viewMode,
  onViewModeChange,
  resultsCount,
  onResetFilters,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      {/* Main Filter Bar Card */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-stone-200 shadow-xs flex flex-col lg:flex-row items-center gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por oficio o servicio (ej. lavadoras, neveras, mecánica, belleza, plomería)..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 hover:bg-stone-100/60 focus:bg-white text-xs sm:text-sm text-stone-800 placeholder-stone-400 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
          />
        </div>

        {/* Controls Container */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 w-full lg:w-auto">
          
          {/* Radius Slider (Exact match to screenshot) */}
          <div className="flex items-center gap-2.5 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700">
            <div className="flex items-center gap-1.5 shrink-0">
              <Compass className="w-4 h-4 text-amber-600" />
              <span>Radio: <b className="text-stone-900">{radiusKm < 1 ? radiusKm.toFixed(1) : radiusKm} km</b></span>
            </div>
            <input
              id="slider-radius"
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              value={Math.min(Math.max(radiusKm, 0.5), 20)}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="w-20 sm:w-24 accent-amber-600 cursor-pointer"
              title={`Ajustar radio a ${Math.min(Math.max(radiusKm, 0.5), 20)} km`}
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-700">
            <span className="text-stone-500 hidden sm:inline">Ordenar:</span>
            <select
              id="select-sort"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-stone-900 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="cercanos">Más cercanos a la obra</option>
              <option value="calificados">Mejor calificados</option>
              <option value="precio_bajo">Tarifa: Menor a mayor</option>
              <option value="experiencia">Más obras realizadas</option>
            </select>
          </div>

          {/* Available Today Toggle */}
          <button
            id="toggle-available-today"
            onClick={onToggleAvailableToday}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              availableTodayOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${availableTodayOnly ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-stone-400'}`}></span>
            <span>Disponibles Hoy</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
            <button
              id="btn-view-split"
              onClick={() => onViewModeChange('split')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'split' ? 'bg-white shadow-xs text-amber-600 font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Vista Dividida (Lista + Mapa)"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              id="btn-view-list"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white shadow-xs text-amber-600 font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Solo Lista"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              id="btn-view-map"
              onClick={() => onViewModeChange('map')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'map' ? 'bg-white shadow-xs text-amber-600 font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Solo Mapa"
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Sub-header: Count and Reset button */}
      <div className="flex items-center justify-between py-2.5 text-xs text-stone-600">
        <div>
          Mostrando <span className="font-bold text-stone-900">{resultsCount}</span> colaboradores de oficios varios calificados
        </div>
        <button
          id="btn-reset-filters"
          onClick={onResetFilters}
          className="flex items-center gap-1.5 text-amber-700 hover:text-amber-800 font-semibold transition cursor-pointer hover:underline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer filtros</span>
        </button>
      </div>
    </div>
  );
};
