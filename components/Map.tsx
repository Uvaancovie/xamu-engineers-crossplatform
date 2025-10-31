import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Webpack
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  fieldData?: any[];
  onLocationSelect?: (location: { lat: number; lng: number; description: string }) => void;
}

const Map: React.FC<MapProps> = ({ fieldData = [], onLocationSelect }) => {
  const defaultCenter: [number, number] = [37.0902, -95.7129]; // Center of US

  return (
    <MapContainer center={defaultCenter} zoom={4} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {fieldData.map((entry, index) => {
        if (entry.location && entry.location.lat !== 0 && entry.location.lng !== 0) {
          return (
            <Marker key={index} position={[entry.location.lat, entry.location.lng]}>
              <Popup>
                <h3>{entry.location.description}</h3>
                <p>Vegetation: {entry.biophysical.vegetationType}</p>
              </Popup>
            </Marker>
          );
        }
        return null;
      })}
    </MapContainer>
  );
};

export default Map;