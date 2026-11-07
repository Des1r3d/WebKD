import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ProviderType } from '../types';

export interface MapMarkerItem {
  id: string;
  name: string;
  type: ProviderType;
  category: string;
  address: string;
  lat: number;
  lng: number;
  distance_m?: number;
  open_hours?: string;
  min_price?: number;
}

interface LeafletMapProps {
  markers: MapMarkerItem[];
  centerLat?: number;
  centerLng?: number;
  radiusM?: number;
  activeId?: string;
  onSelectMarker: (id: string) => void;
  className?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  markers,
  centerLat = 10.8752,
  centerLng = 106.8007,
  radiusM = 1000,
  activeId,
  onSelectMarker,
  className = 'w-full h-[360px] sm:h-[460px] rounded-lg overflow-hidden border border-border-default shadow-xs',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    // TileLayer OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Marker vị trí người dùng (Tâm Làng ĐH)
    const userPinIcon = L.divIcon({
      className: 'custom-user-pin',
      html: `
        <div style="position: relative; width: 28px; height: 28px;">
          <div style="position: absolute; inset: 0; border-radius: 50%; background-color: rgba(59, 130, 246, 0.3); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background-color: #2563eb; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const userMarker = L.marker([centerLat, centerLng], { icon: userPinIcon }).addTo(map);
    userMarker.bindPopup('<b>Vị trí của bạn</b><br/>NVH Sinh Viên ĐHQG TP.HCM');

    // Vòng tròn bán kính
    const circle = L.circle([centerLat, centerLng], {
      radius: radiusM,
      color: '#059669',
      weight: 1.5,
      opacity: 0.7,
      fillColor: '#10b981',
      fillOpacity: 0.08,
      dashArray: '4, 6',
    }).addTo(map);

    radiusCircleRef.current = circle;

    // Layer chứa các markers địa điểm
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Cập nhật vòng tròn bán kính khi radiusM thay đổi
  useEffect(() => {
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setRadius(radiusM);
    }
  }, [radiusM]);

  // Cập nhật các marker địa điểm
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach((item) => {
      const isVenue = item.type === ProviderType.VENUE;
      const isActive = item.id === activeId;

      const bgColor = isVenue ? '#059669' : '#d97706';
      const badgeIcon = isVenue ? '🏸' : '🧋';

      const customIcon = L.divIcon({
        className: 'custom-venue-pin',
        html: `
          <div style="position: relative; cursor: pointer; transition: transform 0.2s;">
            ${
              isActive
                ? `<div style="position: absolute; inset: -4px; border-radius: 50%; background-color: ${bgColor}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ''
            }
            <div style="
              width: ${isActive ? '36px' : '30px'};
              height: ${isActive ? '36px' : '30px'};
              border-radius: 50%;
              background-color: ${bgColor};
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${isActive ? '16px' : '13px'};
              border: 2px solid #ffffff;
              box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              transform: ${isActive ? 'scale(1.1)' : 'scale(1)'};
            ">
              ${badgeIcon}
            </div>
            <div style="
              position: absolute;
              bottom: -4px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 4px solid transparent;
              border-right: 4px solid transparent;
              border-top: 5px solid ${bgColor};
            "></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon });

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 180px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${bgColor}; margin-bottom: 2px;">
            ${isVenue ? 'Sân & Phòng học' : 'Quán Nước & FNB'}
          </div>
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 3px;">
            ${item.name}
          </div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
            ${item.address}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 5px; font-size: 11px;">
            <span style="color: #059669; font-weight: 600;">
              Cách ${item.distance_m || 0}m
            </span>
            <button id="btn-select-${item.id}" style="
              background-color: #059669;
              color: white;
              border: none;
              border-radius: 4px;
              padding: 2px 8px;
              font-weight: 600;
              cursor: pointer;
            ">Chọn xem</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onSelectMarker(item.id);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${item.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectMarker(item.id);
          };
        }
      });

      markersLayerRef.current?.addLayer(marker);

      if (isActive && mapInstanceRef.current) {
        marker.openPopup();
      }
    });
  }, [markers, activeId]);

  return <div ref={mapContainerRef} className={className} />;
};
