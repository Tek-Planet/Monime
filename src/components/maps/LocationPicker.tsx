import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLng } from "leaflet";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AddressSearch } from "./AddressSearch";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in react-leaflet - use factory function
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  height?: string;
}

// Component to handle map clicks
function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to fly to location
function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

export function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  readOnly = false,
  height = "300px",
}: LocationPickerProps) {
  const { t } = useLanguage();
  const [position, setPosition] = useState<LatLng | null>(
    latitude && longitude ? L.latLng(latitude, longitude) : null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  // Default center: Freetown, Sierra Leone
  const defaultCenter: [number, number] = [8.4657, -13.2317];
  const center: [number, number] = position
    ? [position.lat, position.lng]
    : defaultCenter;

  const handleLocationChange = (lat: number, lng: number) => {
    if (readOnly) return;
    const newPosition = L.latLng(lat, lng);
    setPosition(newPosition);
    onLocationChange?.(lat, lng);
  };

  const handleAddressSelect = (lat: number, lng: number, displayName: string) => {
    handleLocationChange(lat, lng);
    setFlyTo({ lat, lng });
    setSelectedAddress(displayName);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t("location.notSupported"));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        handleLocationChange(lat, lng);
        setFlyTo({ lat, lng });
        setSelectedAddress(null);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(t("location.error"));
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="space-y-3">
          {/* Address search */}
          <AddressSearch onLocationSelect={handleAddressSelect} />
          
          {/* Current location button */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {t("location.useCurrentLocation")}
            </Button>
            {position && (
              <span className="text-xs text-muted-foreground">
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </span>
            )}
          </div>

          {/* Selected address display */}
          {selectedAddress && (
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{selectedAddress}</span>
            </p>
          )}
        </div>
      )}

      <div style={{ height }} className="rounded-lg overflow-hidden border">
        <MapContainer
          center={center}
          zoom={position ? 15 : 10}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={!readOnly}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {!readOnly && <MapClickHandler onLocationChange={handleLocationChange} />}

          {flyTo && <FlyToLocation lat={flyTo.lat} lng={flyTo.lng} />}

          {position && <Marker position={position} icon={defaultIcon} />}
        </MapContainer>
      </div>

      {!readOnly && !position && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {t("location.clickToSelect")}
        </p>
      )}
    </div>
  );
}
