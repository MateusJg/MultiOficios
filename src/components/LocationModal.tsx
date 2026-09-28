import React, { useState } from 'react';
import { X, MapPin, Navigation, Check } from 'lucide-react';
import { LocationCoordinates } from '../types';

interface LocationModalProps {
  currentLocation: LocationCoordinates;
  onClose: () => void;
  onSelectLocation: (newLocation: LocationCoordinates) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  currentLocation,
  onClose,
  onSelectLocation,
}) => {
  const PRESET_LOCATIONS: LocationCoordinates[] = [
    {
      lat: 4.6345,
      lng: -74.1458,
      address: 'Calle 8 # 78-45',
      city: 'Bogotá D.C.',
      neighborhood: 'Kennedy / Castilla',
    },
    {
      lat: 4.6185,
      lng: -74.1210,
      address: 'Calle 10 sur # 34-12',
      city: 'Bogotá D.C.',
      neighborhood: 'Puente Aranda / Ciudad Montes',
    },
    {
      lat: 4.6750,
      lng: -74.1200,
      address: 'Carrera 77 # 53-15',
      city: 'Bogotá D.C.',
      neighborhood: 'Engativá / Normandía',
    },
    {
      lat: 4.6410,
      lng: -74.0950,
      address: 'Calle 26 # 50-20',
      city: 'Bogotá D.C.',
      neighborhood: 'Teusaquillo / Salitre',
    },
    {
      lat: 4.6580,
      lng: -74.0620,
      address: 'Carrera 13 # 60-35',
      city: 'Bogotá D.C.',
      neighborhood: 'Chapinero Central',
    },
    {
      lat: 4.7110,
      lng: -74.0300,
      address: 'Carrera 7 # 140-20',
      city: 'Bogotá D.C.',
      neighborhood: 'Usaquén / Cedritos',
    },
    {
      lat: 4.7450,
      lng: -74.0850,
      address: 'Avenida Suba # 115-40',
      city: 'Bogotá D.C.',
      neighborhood: 'Suba / Rincón',
    },
    {
      lat: 4.6720,
      lng: -74.1450,
      address: 'Calle 22 # 99-30',
      city: 'Bogotá D.C.',
      neighborhood: 'Fontibón / Modelia',
    },
    {
      lat: 4.6050,
      lng: -74.1800,
      address: 'Transversal 85 # 65 sur',
      city: 'Bogotá D.C.',
      neighborhood: 'Bosa / El Recreo',
    },
  ];

  const handleUseGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onSelectLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: 'Ubicación GPS Detectada',
            city: 'Bogotá D.C.',
            neighborhood: 'Mi Ubicación Actual',
          });
          onClose();
        },
        () => {
          alert('No se pudo acceder al GPS. Selecciona una zona de la lista.');
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-white">Selecciona la Ubicación de la Obra</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <button
            onClick={handleUseGPS}
            className="w-full p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-amber-700" />
            <span>Usar mi ubicación GPS actual en tiempo real</span>
          </button>

          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Zonas y Barrios Frecuentes
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {PRESET_LOCATIONS.map((loc, idx) => {
              const isCurrent = loc.neighborhood === currentLocation.neighborhood;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectLocation(loc);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    isCurrent
                      ? 'bg-amber-50 border-amber-500 font-bold text-amber-950 ring-1 ring-amber-500/20'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                  }`}
                >
                  <div className="text-xs">
                    <div className="font-bold">{loc.neighborhood}</div>
                    <div className="text-[11px] text-stone-500">{loc.address}, {loc.city}</div>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
