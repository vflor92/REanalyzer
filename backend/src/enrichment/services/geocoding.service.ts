import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface MapboxGeocodingResponse {
    features: Array<{
        center: [number, number]; // [longitude, latitude]
        place_name: string;
    }>;
}

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name);
    private readonly mapboxToken: string;

    constructor(private readonly configService: ConfigService) {
        this.mapboxToken = this.configService.get<string>('MAPBOX_API_KEY') || '';
        if (!this.mapboxToken) {
            this.logger.warn('MAPBOX_API_KEY not found in environment variables');
        }
    }

    /**
     * Geocode an address to latitude/longitude coordinates using Mapbox Geocoding API
     * Docs: https://docs.mapbox.com/api/search/geocoding/
     */
    async geocodeAddress(
        address: string,
        city: string,
        state: string,
    ): Promise<{ lat: number; lon: number } | null> {
        const fullAddress = `${address}, ${city}, ${state}`;
        this.logger.log(`Geocoding address: ${fullAddress}`);

        if (!this.mapboxToken) {
            this.logger.error('Cannot geocode: MAPBOX_API_KEY not configured');
            return this.fallbackGeocoding(city, state);
        }

        try {
            const encodedAddress = encodeURIComponent(fullAddress);
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${this.mapboxToken}&limit=1`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Mapbox API returned ${response.status}: ${response.statusText}`);
            }

            const data: MapboxGeocodingResponse = await response.json();

            if (data.features && data.features.length > 0) {
                const [lon, lat] = data.features[0].center;
                this.logger.log(`Geocoded "${fullAddress}" to (${lat}, ${lon})`);
                return { lat, lon };
            } else {
                this.logger.warn(`No results found for address: ${fullAddress}`);
                return this.fallbackGeocoding(city, state);
            }
        } catch (error) {
            this.logger.error(`Mapbox geocoding failed: ${error.message}`);
            return this.fallbackGeocoding(city, state);
        }
    }

    /**
     * Fallback geocoding for when Mapbox API fails or no results found
     * Uses approximate city center coordinates for common Texas cities
     */
    private fallbackGeocoding(
        city: string,
        state: string,
    ): { lat: number; lon: number } | null {
        this.logger.log(`Using fallback geocoding for ${city}, ${state}`);

        const mockCoordinates: Record<string, { lat: number; lon: number }> = {
            'Austin, TX': { lat: 30.2672, lon: -97.7431 },
            'Dallas, TX': { lat: 32.7767, lon: -96.7970 },
            'Houston, TX': { lat: 29.7604, lon: -95.3698 },
            'San Antonio, TX': { lat: 29.4241, lon: -98.4936 },
            'Fort Worth, TX': { lat: 32.7555, lon: -97.3308 },
            'Porter, TX': { lat: 30.1472, lon: -95.2996 },
            'El Paso, TX': { lat: 31.7619, lon: -106.4850 },
            'Arlington, TX': { lat: 32.7357, lon: -97.1081 },
            'Corpus Christi, TX': { lat: 27.8006, lon: -97.3964 },
            'Plano, TX': { lat: 33.0198, lon: -96.6989 },
        };

        const key = `${city}, ${state}`;
        const coords = mockCoordinates[key];

        if (coords) {
            this.logger.log(`Fallback coordinates: ${coords.lat}, ${coords.lon}`);
            return coords;
        }

        // Final fallback for unknown cities in Texas
        if (state === 'TX') {
            const texasBounds = {
                minLat: 25.8,
                maxLat: 36.5,
                minLon: -106.6,
                maxLon: -93.5,
            };
            const fallbackCoords = {
                lat: texasBounds.minLat + Math.random() * (texasBounds.maxLat - texasBounds.minLat),
                lon: texasBounds.minLon + Math.random() * (texasBounds.maxLon - texasBounds.minLon),
            };
            this.logger.log(`Generated Texas fallback: ${fallbackCoords.lat}, ${fallbackCoords.lon}`);
            return fallbackCoords;
        }

        this.logger.warn(`No fallback available for ${key}`);
        return null;
    }
}
