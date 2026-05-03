import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, Polygon, Tooltip } from 'react-leaflet';
import { useAppContext } from '../context/AppContext';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import * as turf from '@turf/turf';
import FreeDraw from 'leaflet-freedraw';
import styles from './FieldMap.module.css';

// Fix para los íconos por defecto de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para la barra de búsqueda
const SearchField = () => {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider({
      params: { 'accept-language': 'es' }
    });

    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Buscar ciudad, pueblo o lugar...'
    });

    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);

  return null;
};

// Componente para Dibujar Polígonos de Cultivos
const CustomDrawControls = () => {
  const map = useMap();

  useEffect(() => {
    map.pm.setLang('es');
    map.pm.setGlobalOptions({ 
      measurements: { measurement: true, displayFormat: 'metric' },
      tooltips: false
    });

    // Crear un botón personalizado para activar el dibujo de polígonos
    const control = L.control({ position: 'bottomleft' });
    control.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const btn = L.DomUtil.create('button', '', container);
      btn.innerHTML = '✏️ Dibujar Lote de Siembra';
      btn.style.backgroundColor = 'white';
      btn.style.border = 'none';
      btn.style.padding = '10px 16px';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = 'bold';
      btn.style.color = '#1a5f5a';
      btn.style.borderRadius = '8px';
      btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
      btn.style.fontSize = '13px';
      
      let isDrawing = false;

      btn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        isDrawing = !isDrawing;
        if (isDrawing) {
          map.pm.enableDraw('Polygon', {
            snappable: true,
            snapDistance: 20,
            hintlineStyle: { color: '#2a7d6f', dashArray: '5,5' },
            templineStyle: { color: '#2a7d6f' },
          });
          btn.style.backgroundColor = '#e8f5f2';
          btn.innerHTML = '✅ Terminar Dibujo (Click en primer punto)';
        } else {
          map.pm.disableDraw();
          btn.style.backgroundColor = 'white';
          btn.innerHTML = '✏️ Dibujar Lote de Siembra';
        }
      };

      map.on('pm:drawend', () => {
        isDrawing = false;
        btn.style.backgroundColor = 'white';
        btn.innerHTML = '✏️ Dibujar Lote de Siembra';
      });

      return container;
    };
    
    control.addTo(map);

    map.on('pm:create', (e) => {
      const layer = e.layer;
      const shape = e.shape;
      
      if (shape === 'Polygon') {
        const geojson = layer.toGeoJSON();
        const areaSqMeters = turf.area(geojson);
        const areaHectares = areaSqMeters / 10000;
        
        setTimeout(() => {
          const cultivo = window.prompt("¿Qué cultivo sembraste aquí? (Ej: Maíz, Cacao, Yuca, Plátano)", "Maíz");
          
          let color = '#22c55e';
          let name = cultivo || 'Nuevo Lote';
          let emoji = '🌱';
          
          const lowerName = name.toLowerCase();
          if(lowerName.includes('maiz') || lowerName.includes('maíz')) { color = '#c8860a'; emoji = '🌽'; }
          else if(lowerName.includes('cacao')) { color = '#8B4513'; emoji = '🍫'; }
          else if(lowerName.includes('yuca')) { color = '#e07b54'; emoji = '🥔'; }
          else if(lowerName.includes('platano') || lowerName.includes('plátano')) { color = '#3a9e8a'; emoji = '🍌'; }

          layer.setStyle({
            color: color,
            fillColor: color,
            fillOpacity: 0.45,
            weight: 3
          });

          const tooltipContent = `
            <div style="text-align: center; font-weight: bold; font-family: Inter, sans-serif; background: rgba(255,255,255,0.9); padding: 4px 8px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid ${color}40;">
              <span style="font-size: 15px; color: #1f2937;">${emoji} ${name}</span><br/>
              <span style="font-size: 12px; color: #4b5563;">${areaHectares.toFixed(2)} ha</span>
            </div>
          `;
          
          layer.bindTooltip(tooltipContent, { permanent: true, direction: "center", className: 'custom-crop-tooltip' }).openTooltip();
        }, 100);
      }
    });

    return () => {
      map.removeControl(control);
      map.off('pm:create');
      map.off('pm:drawend');
    };
  }, [map]);

  return null;
};

// Componente para ingresar coordenadas manuales
const ManualCoordinatesControl = ({ onAddPolygon }) => {
  const map = useMap();

  useEffect(() => {
    const control = L.control({ position: 'bottomleft' });
    control.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const btn = L.DomUtil.create('button', '', container);
      btn.innerHTML = '📍 Ingresar Coordenadas Exactas';
      btn.style.backgroundColor = 'white';
      btn.style.border = 'none';
      btn.style.padding = '10px 16px';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = 'bold';
      btn.style.color = '#c8860a';
      btn.style.borderRadius = '8px';
      btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
      btn.style.fontSize = '13px';
      btn.style.marginTop = '10px';

      btn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const coordsStr = window.prompt(
          "Ingresa las coordenadas de la finca separadas por punto y coma.\nEjemplo: 8.625,-70.209; 8.625,-70.204; 8.620,-70.204", 
          ""
        );

        if (coordsStr) {
          try {
            const pairs = coordsStr.split(';').map(p => p.trim()).filter(p => p);
            const latLngs = pairs.map(p => {
              const [lat, lng] = p.split(',').map(Number);
              if (isNaN(lat) || isNaN(lng)) throw new Error("Formato inválido");
              return [lat, lng];
            });

            if (latLngs.length >= 3) {
              onAddPolygon(latLngs);
              map.fitBounds(latLngs);
            } else {
              alert("Debes ingresar al menos 3 puntos (coordenadas) para formar un polígono.");
            }
          } catch (err) {
            alert("Hubo un error al procesar las coordenadas. Asegúrate de usar el formato: latitud,longitud; latitud,longitud");
          }
        }
      };

      return container;
    };
    
    control.addTo(map);

    return () => {
      map.removeControl(control);
    };
  }, [map, onAddPolygon]);

  return null;
};

export default function FieldMap() {
  const { data } = useAppContext();
  const { activeCrops } = data;
  const [userPolygons, setUserPolygons] = useState([]);
  
  // Centro en Barinas (Sector La Yuca) o centrado automático
  const defaultCenter = [8.6226, -70.2065]; 

  const handleAddPolygon = (latLngs) => {
    const polygonGeoJSON = turf.polygon([[...latLngs.map(ll => [ll[1], ll[0]]), [latLngs[0][1], latLngs[0][0]]]]);
    const areaSqMeters = turf.area(polygonGeoJSON);
    const areaHectares = areaSqMeters / 10000;
    
    setUserPolygons(prev => [...prev, {
      id: Date.now(),
      positions: latLngs,
      area: areaHectares
    }]);
  };

  return (
    <div className={styles.mapWrapper}>
      <MapContainer 
        center={defaultCenter} 
        zoom={15} 
        scrollWheelZoom={true} 
        className={styles.mapContainer}
        attributionControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        {/* Cultivos Activos Registrados en Firebase */}
        {activeCrops?.map(crop => {
          if (!crop.coordenadas || crop.coordenadas.length < 3) return null;
          
          let color = '#22c55e';
          let emoji = '🌱';
          const lowerName = crop.rubro.toLowerCase();
          if(lowerName.includes('maiz') || lowerName.includes('maíz')) { color = '#c8860a'; emoji = '🌽'; }
          else if(lowerName.includes('cacao')) { color = '#8B4513'; emoji = '🍫'; }
          else if(lowerName.includes('yuca')) { color = '#e07b54'; emoji = '🥔'; }
          else if(lowerName.includes('platano') || lowerName.includes('plátano')) { color = '#3a9e8a'; emoji = '🍌'; }

          return (
            <Polygon 
              key={crop.id}
              pathOptions={{ color: color, fillColor: color, fillOpacity: 0.45, weight: 3 }} 
              positions={crop.coordenadas.map(c => [c[1], c[0]])}
            >
              <Tooltip direction="center" permanent offset={[0, 0]} opacity={1}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontFamily: 'Inter', background: 'rgba(255,255,255,0.95)', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${color}40`, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                  <span style={{ fontSize: '15px', color: '#1f2937' }}>{emoji} {crop.rubro}</span><br/>
                  <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '500' }}>{crop.hectareas} ha ({crop.lote})</span>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* Polígonos de Finca Manuales */}
        {userPolygons.map(poly => (
          <Polygon 
            key={poly.id}
            pathOptions={{ color: '#c8860a', fillColor: '#c8860a', fillOpacity: 0.3, weight: 3 }} 
            positions={poly.positions}
          >
            <Tooltip direction="center" permanent offset={[0, 0]} opacity={0.9} style={{ fontWeight: 'bold', color: '#8B4513', border: 'none', background: 'white' }}>
              📍 Finca Mapeada<br/>
              <span style={{ fontSize: 11, fontWeight: 'normal' }}>{poly.area.toFixed(2)} ha</span>
            </Tooltip>
          </Polygon>
        ))}

        {/* Barra de Búsqueda */}
        <SearchField />

        {/* Botón Personalizado para Dibujo */}
        <CustomDrawControls />

        {/* Botón Personalizado para Coordenadas Manuales */}
        <ManualCoordinatesControl onAddPolygon={handleAddPolygon} />

      </MapContainer>
    </div>
  );
}
