import React, { useRef, useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Hammer, 
  Wrench, 
  Zap, 
  Paintbrush, 
  Sparkles, 
  Drill, 
  Laptop, 
  Key, 
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  FileBadge,
  WashingMachine,
  Refrigerator,
  Car,
  Scissors,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    // Permit horizontal navigation via desktop mouse wheel
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !isExpanded) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('scroll', checkScroll);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', checkScroll);
    };
  }, [isExpanded, categories]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distance = direction === 'left' ? -340 : 340;
    el.scrollBy({ left: distance, behavior: 'smooth' });
  };

  const handleCategoryClick = (categoryId: string) => {
    onSelectCategory(categoryId);
    const btn = document.getElementById(`cat-btn-${categoryId}`);
    if (btn && !isExpanded) {
      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'LayoutGrid':
        return <LayoutGrid className="w-4 h-4" />;
      case 'Hammer':
        return <Hammer className="w-4 h-4" />;
      case 'Wrench':
        return <Wrench className="w-4 h-4" />;
      case 'Zap':
        return <Zap className="w-4 h-4" />;
      case 'Paintbrush':
        return <Paintbrush className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'Drill':
        return <Drill className="w-4 h-4" />;
      case 'Laptop':
        return <Laptop className="w-4 h-4" />;
      case 'Key':
        return <Key className="w-4 h-4" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-4 h-4" />;
      case 'WashingMachine':
        return <WashingMachine className="w-4 h-4" />;
      case 'Refrigerator':
        return <Refrigerator className="w-4 h-4" />;
      case 'Car':
        return <Car className="w-4 h-4" />;
      case 'Scissors':
        return <Scissors className="w-4 h-4" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white border-b border-stone-200">
      {/* Top Value Proposition Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white text-[11px] sm:text-xs font-semibold py-2 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1 gap-x-4">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-200 shrink-0" />
            <span>MultiOficios: Técnicos y operarios verificados para obras, mantenimientos locativos y reparaciones a domicilio.</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-amber-100 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-amber-300" /> Contratación por jornales o servicio
            </span>
            <span className="hidden md:flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-amber-300" /> Personal calificado y verificado
            </span>
            <span className="hidden lg:flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-amber-300" /> Calificaciones y reseñas verificadas
            </span>
          </div>
        </div>
      </div>

      {/* Category Pills Bar with Enhanced Navigation Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center gap-2.5">

          {/* Scrollable Container Wrapper with Arrows */}
          <div className="relative flex-1 min-w-0 flex items-center">
            
            {/* Left Scroll Arrow */}
            {!isExpanded && canScrollLeft && (
              <button
                type="button"
                onClick={() => scroll('left')}
                className="absolute left-0 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md border border-stone-300 text-stone-700 hover:text-amber-800 hover:bg-amber-50 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Ver oficios anteriores"
                aria-label="Ver oficios anteriores"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Left fade gradient */}
            {!isExpanded && canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
            )}

            {/* Category Pills */}
            <div
              ref={scrollContainerRef}
              className={`w-full ${
                isExpanded
                  ? 'flex flex-wrap gap-2 py-1'
                  : 'flex items-center gap-2 overflow-x-auto scroll-smooth py-1 px-1 thin-scrollbar'
              }`}
            >
              {categories.map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    id={`cat-btn-${category.id}`}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30 ring-2 ring-amber-600/20'
                        : 'bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-100/90 border border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : 'text-stone-500'}>
                      {getIcon(category.iconName)}
                    </span>
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Right fade gradient */}
            {!isExpanded && canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />
            )}

            {/* Right Scroll Arrow */}
            {!isExpanded && canScrollRight && (
              <button
                type="button"
                onClick={() => scroll('right')}
                className="absolute right-0 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md border border-stone-300 text-stone-700 hover:text-amber-800 hover:bg-amber-50 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Ver más oficios (Plomería, Electricidad, Pintura, etc.)"
                aria-label="Ver más oficios"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Toggle "Desplegar todos los oficios" / "Modo carrusel" */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs border ${
              isExpanded
                ? 'bg-amber-600 text-white border-amber-600'
                : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-200'
            }`}
            title={isExpanded ? 'Ver en una sola fila deslizable' : 'Desplegar todos los oficios en cuadrícula completa'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Modo Carrusel</span>
                <span className="sm:hidden">Cerrar</span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-amber-700" />
                <span>Desplegar Oficios</span>
                <ChevronDown className="w-3 h-3 text-amber-700" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
