// Google Maps API type declarations
declare global {
  interface Window {
    google: typeof google;
    initMap?: () => void;
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng | undefined;
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(map?: Map, anchor?: Marker): void;
      close(): void;
      setContent(content: string): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class Geocoder {
      constructor();
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[], status: GeocoderStatus) => void): void;
    }

    class PlacesService {
      constructor(attrContainer: HTMLElement | Map);
      nearbySearch(request: PlaceSearchRequest, callback: (results: PlaceResult[], status: PlacesServiceStatus) => void): void;
    }

    class DirectionsService {
      constructor();
      route(request: DirectionsRequest, callback: (result: DirectionsResult, status: DirectionsStatus) => void): void;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      styles?: MapTypeStyle[];
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Symbol | Icon;
    }

    interface InfoWindowOptions {
      content?: string;
      position?: LatLng | LatLngLiteral;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface GeocoderRequest {
      address?: string;
      location?: LatLng | LatLngLiteral;
      placeId?: string;
    }

    interface GeocoderResult {
      formatted_address: string;
      geometry: {
        location: LatLng;
        location_type: string;
      };
      place_id: string;
      types: string[];
    }

    interface PlaceSearchRequest {
      location: LatLng | LatLngLiteral;
      radius: number;
      type?: string;
      keyword?: string;
    }

    interface PlaceResult {
      place_id: string;
      name: string;
      formatted_address: string;
      geometry: {
        location: LatLng;
      };
      rating?: number;
      types: string[];
    }

    interface DirectionsRequest {
      origin: LatLng | LatLngLiteral | string;
      destination: LatLng | LatLngLiteral | string;
      travelMode: TravelMode;
    }

    interface DirectionsResult {
      routes: DirectionsRoute[];
    }

    interface DirectionsRoute {
      legs: DirectionsLeg[];
      overview_path: LatLng[];
    }

    interface DirectionsLeg {
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      start_location: LatLng;
      end_location: LatLng;
    }

    interface MapTypeStyle {
      featureType?: string;
      elementType?: string;
      stylers: any[];
    }

    interface Icon {
      url: string;
      size?: Size;
      origin?: Point;
      anchor?: Point;
    }

    interface Symbol {
      path: string | SymbolPath;
      anchor?: Point;
      fillColor?: string;
      fillOpacity?: number;
      rotation?: number;
      scale?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }

    interface Size {
      width: number;
      height: number;
    }

    interface Point {
      x: number;
      y: number;
    }

    enum GeocoderStatus {
      ERROR = "ERROR",
      INVALID_REQUEST = "INVALID_REQUEST",
      OK = "OK",
      OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
      REQUEST_DENIED = "REQUEST_DENIED",
      UNKNOWN_ERROR = "UNKNOWN_ERROR",
      ZERO_RESULTS = "ZERO_RESULTS",
    }

    enum PlacesServiceStatus {
      INVALID_REQUEST = "INVALID_REQUEST",
      NOT_FOUND = "NOT_FOUND",
      OK = "OK",
      OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
      REQUEST_DENIED = "REQUEST_DENIED",
      UNKNOWN_ERROR = "UNKNOWN_ERROR",
      ZERO_RESULTS = "ZERO_RESULTS",
    }

    enum SymbolPath {
      BACKWARD_CLOSED_ARROW = 0,
      BACKWARD_OPEN_ARROW = 1,
      CIRCLE = 2,
      FORWARD_CLOSED_ARROW = 3,
      FORWARD_OPEN_ARROW = 4,
    }

    enum TravelMode {
      DRIVING = "DRIVING",
      WALKING = "WALKING",
      BICYCLING = "BICYCLING",
      TRANSIT = "TRANSIT",
    }

    enum DirectionsStatus {
      INVALID_REQUEST = "INVALID_REQUEST",
      MAX_WAYPOINTS_EXCEEDED = "MAX_WAYPOINTS_EXCEEDED",
      NOT_FOUND = "NOT_FOUND",
      OK = "OK",
      OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
      REQUEST_DENIED = "REQUEST_DENIED",
      UNKNOWN_ERROR = "UNKNOWN_ERROR",
      ZERO_RESULTS = "ZERO_RESULTS",
    }
  }
}

export {}; 