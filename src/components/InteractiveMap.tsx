import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Collaborator, LocationCoordinates } from '../types';
import { MapPin, Navigation, Eye, ZoomIn, ZoomOut } from 'lucide-react';

interface InteractiveMapProps {
  userLocation: LocationCoordinates;
  collaborators: Collaborator[];
  radiusKm: number;
  selectedCollaboratorId: string | null;
  onSelectCollaborator: (colab: Collaborator) => void;
  onHireCollaborator: (colab: Collaborator) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  userLocation,
  collaborators,
  radiusKm,
  selectedCollaboratorId,
  onSelectCollaborator,
  onHireCollaborator,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 13,
      zoomControl: false,
    });

    // OpenStreetMap official tiles (100% free, open-source, no API key or watermark required)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Zoom control
    L.control.zoom({ position: 'topleft' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Trigger resize calculation safely only if map container still exists and map is valid
    let rafId: number | null = null;
    rafId = requestAnimationFrame(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize({ animate: false });
        } catch {
          // ignore if unmounted
        }
      }
    });

    const timer1 = setTimeout(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize({ animate: false });
        } catch {
          // ignore
        }
      }
    }, 200);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearTimeout(timer1);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.remove();
        } catch {
          // ignore if already destroyed
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle container resizing (e.g. split view toggles, sidebar changes)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize({ animate: false });
        } catch {
          // ignore
        }
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update center, circle, and markers when location or collaborators change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Update radius circle
    if (circleLayerRef.current) {
      circleLayerRef.current.remove();
    }

    circleLayerRef.current = L.circle([userLocation.lat, userLocation.lng], {
      radius: radiusKm * 1000,
      color: '#ea580c',
      weight: 2,
      opacity: 0.8,
      fillColor: '#ea580c',
      fillOpacity: 0.08,
      dashArray: '6, 6',
    }).addTo(map);

    // Update markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      // 1. User Work Location Marker
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 34px; height: 34px; background-color: rgba(234, 88, 12, 0.35); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 28px; height: 28px; background-color: #ea580c; border: 3px solid white; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">
              ★
            </div>
            <div style="position: absolute; top: 32px; background-color: #1c1917; color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              Tu Obra
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
      userMarker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <div style="font-weight: bold; color: #ea580c; font-size: 13px;">Ubicación de tu Obra</div>
          <div style="font-size: 12px; color: #44403c; margin-top: 2px;">${userLocation.address}</div>
          <div style="font-size: 11px; color: #78716c;">${userLocation.neighborhood}, ${userLocation.city}</div>
        </div>
      `);
      markersLayerRef.current.addLayer(userMarker);

      // 2. Collaborators Markers
      collaborators.forEach((colab) => {
        const isSelected = colab.id === selectedCollaboratorId;
        const colabIcon = L.divIcon({
          className: `custom-colab-marker-${colab.id}`,
          html: `
            <div style="position: relative; cursor: pointer; transition: transform 0.2s ease;">
              <div style="
                width: ${isSelected ? '48px' : '40px'}; 
                height: ${isSelected ? '48px' : '40px'}; 
                border-radius: 9999px; 
                border: 3px solid ${isSelected ? '#ea580c' : '#ffffff'}; 
                box-shadow: 0 4px 10px rgba(0,0,0,0.3); 
                overflow: hidden; 
                background: white;
              ">
                <img src="${colab.avatar}" alt="${colab.name}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
              <div style="
                position: absolute; 
                bottom: -4px; 
                right: -4px; 
                background-color: #10b981; 
                color: white; 
                font-size: 9px; 
                font-weight: bold; 
                padding: 1px 4px; 
                border-radius: 9999px; 
                border: 2px solid white;
              ">
                ★ ${colab.rating}
              </div>
            </div>
          `,
          iconSize: [isSelected ? 48 : 40, isSelected ? 48 : 40],
          iconAnchor: [isSelected ? 24 : 20, isSelected ? 24 : 20],
        });

        const marker = L.marker([colab.location.lat, colab.location.lng], { icon: colabIcon });

        // Popup with mini profile card
        const popupContent = document.createElement('div');
        popupContent.style.fontFamily = 'inherit';
        popupContent.style.minWidth = '220px';
        popupContent.innerHTML = `
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <img src="${colab.avatar}" style="width: 40px; height: 40px; border-radius: 9999px; object-fit: cover;" />
            <div>
              <div style="font-weight: 700; color: #1c1917; font-size: 13px;">${colab.name}</div>
              <div style="font-size: 11px; color: #ea580c; font-weight: 600;">${colab.specialtyTitle.slice(0, 32)}...</div>
            </div>
          </div>
          <div style="font-size: 11px; color: #57534e; margin-bottom: 8px;">
            📍 ${colab.distanceKm} km (${colab.location.neighborhood})<br/>
            ⭐ <b>${colab.rating}</b> (${colab.reviewCount} reseñas) • <b>$${colab.dailyRate.toLocaleString('es-CO')}</b>/día
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="view-btn-${colab.id}" style="flex: 1; padding: 4px 8px; font-size: 11px; background: #f5f5f4; border: 1px solid #d6d3d1; border-radius: 6px; cursor: pointer; font-weight: 600;">Ver Perfil</button>
            <button id="hire-btn-${colab.id}" style="flex: 1; padding: 4px 8px; font-size: 11px; background: #ea580c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 700;">Contratar</button>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('popupopen', () => {
          const viewBtn = document.getElementById(`view-btn-${colab.id}`);
          const hireBtn = document.getElementById(`hire-btn-${colab.id}`);
          if (viewBtn) {
            viewBtn.onclick = () => onSelectCollaborator(colab);
          }
          if (hireBtn) {
            hireBtn.onclick = () => onHireCollaborator(colab);
          }
        });

        marker.on('click', () => {
          onSelectCollaborator(colab);
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }
  }, [userLocation, collaborators, radiusKm, selectedCollaboratorId]);

  // Center on selected collaborator if present
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedCollaboratorId || !mapContainerRef.current) return;
    const target = collaborators.find((c) => c.id === selectedCollaboratorId);
    if (target) {
      try {
        mapInstanceRef.current.flyTo([target.location.lat, target.location.lng], 14, {
          duration: 0.8,
        });
      } catch {
        // ignore if pane is unmounted
      }
    }
  }, [selectedCollaboratorId, collaborators]);

  const recenterMap = () => {
    if (mapInstanceRef.current && mapContainerRef.current) {
      try {
        mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 13, {
          duration: 0.8,
        });
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden shadow-inner border border-stone-200 bg-stone-100">
      {/* Map element - absolute inset-0 ensures Leaflet gets positive clientWidth and clientHeight regardless of flex/grid parent */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Floating Status Pill (Matches Screenshot) */}
      <div className="absolute top-4 left-14 z-10 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-stone-200/80 flex items-center gap-2 text-xs font-bold text-stone-800">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>{collaborators.length} colaboradores en radio de {radiusKm} km</span>
      </div>

      {/* Recenter button */}
      <button
        id="btn-recenter-map"
        onClick={recenterMap}
        className="absolute bottom-4 right-4 z-10 bg-white hover:bg-stone-50 text-stone-700 p-2.5 rounded-xl shadow-lg border border-stone-200 flex items-center gap-2 text-xs font-semibold transition-all hover:scale-105 cursor-pointer"
        title="Centrar en mi obra"
      >
        <Navigation className="w-4 h-4 text-amber-600" />
        <span className="hidden sm:inline">Centrar en mi obra</span>
      </button>

      {/* Legend Badge */}
      <div className="absolute bottom-4 left-4 z-10 bg-stone-900/85 backdrop-blur text-white text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Obra Cliente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Técnico Verificado
        </span>
      </div>
    </div>
  );
};
