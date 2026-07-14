import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Icon, divIcon, point } from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { renderToStaticMarkup } from "react-dom/server";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in react-leaflet
const defaultIcon = Icon.prototype.options
  ? new Icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
  : undefined;

// Custom cluster icon
const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let size = "small";
  let dimensions = 36;

  if (count >= 50) {
    size = "large";
    dimensions = 52;
  } else if (count >= 10) {
    size = "medium";
    dimensions = 44;
  }

  return divIcon({
    html: `<span class="cluster-icon cluster-icon--${size}">${count}</span>`,
    className: "custom-marker-cluster",
    iconSize: point(dimensions, dimensions, true),
  });
};

interface Business {
  id: string;
  business_name: string;
  business_type?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface BusinessLocationsMapProps {
  businesses: Business[];
  height?: string;
  onBusinessClick?: (businessId: string) => void;
  searchedLocation?: { lat: number; lng: number } | null;
}

// Component to update map view when searched location changes
function MapUpdater({ searchedLocation }: { searchedLocation: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (searchedLocation) {
      map.flyTo([searchedLocation.lat, searchedLocation.lng], 13, {
        duration: 1.5,
      });
    }
  }, [searchedLocation, map]);

  return null;
}

export function BusinessLocationsMap({
  businesses,
  height = "400px",
  onBusinessClick,
  searchedLocation,
}: BusinessLocationsMapProps) {
  const { t } = useLanguage();

  const locatedBusinesses = businesses.filter(
    (b) => b.latitude != null && b.longitude != null
  );

  // Default center: Freetown, Sierra Leone
  const defaultCenter: [number, number] = [8.4657, -13.2317];

  const center: [number, number] =
    locatedBusinesses.length > 0
      ? [
          locatedBusinesses.reduce((sum, b) => sum + (b.latitude || 0), 0) /
            locatedBusinesses.length,
          locatedBusinesses.reduce((sum, b) => sum + (b.longitude || 0), 0) /
            locatedBusinesses.length,
        ]
      : defaultCenter;

  if (locatedBusinesses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            {t("location.noLocations")}
          </p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {businesses.length} {t("location.businessesWithoutLocation")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5" />
          {t("location.businessLocations")}
          <Badge variant="secondary" className="ml-auto">
            {locatedBusinesses.length} / {businesses.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height }} className="rounded-b-lg overflow-hidden">
          <MapContainer
            center={center}
            zoom={locatedBusinesses.length === 1 ? 14 : 10}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapUpdater searchedLocation={searchedLocation} />

            <MarkerClusterGroup
              chunkedLoading
              iconCreateFunction={createClusterCustomIcon}
              maxClusterRadius={50}
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
            >
              {locatedBusinesses.map((business) => {
                // Create custom marker with business name
                const businessIcon = divIcon({
                  html: renderToStaticMarkup(
                    <div className="flex flex-col items-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="mt-1 bg-white px-2 py-1 rounded shadow-md text-xs font-medium whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">
                        {business.business_name}
                      </div>
                    </div>
                  ),
                  className: "custom-business-marker",
                  iconSize: [120, 60],
                  iconAnchor: [60, 60],
                  popupAnchor: [0, -60],
                });

                return (
                  <Marker
                    key={business.id}
                    position={[business.latitude!, business.longitude!]}
                    icon={businessIcon}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4" />
                          <span className="font-semibold">{business.business_name}</span>
                        </div>
                        {business.business_type && (
                          <Badge variant="outline" className="mb-2">
                            {business.business_type}
                          </Badge>
                        )}
                        {business.address && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {business.address}
                          </p>
                        )}
                        {onBusinessClick && (
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full mt-2"
                            onClick={() => onBusinessClick(business.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {t("admin.view")}
                          </Button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}
