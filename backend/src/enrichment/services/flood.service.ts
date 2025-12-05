import { Injectable, Logger } from '@nestjs/common';

export interface FloodData {
    floodZoneCode: string | null;
    floodSource: string;
}

interface FEMAFeature {
    attributes: {
        FLD_ZONE: string;
        ZONE_SUBTY: string | null;
        STATIC_BFE: number | null;
        SFHA_TF: string;
    };
}

interface FEMAResponse {
    features: FEMAFeature[];
}

@Injectable()
export class FloodService {
    private readonly logger = new Logger(FloodService.name);
    private readonly FEMA_NFHL_URL = 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query';

    /**
     * Get flood zone information for a location using FEMA NFHL Web Service
     * Layer 28 is the SFHA (Special Flood Hazard Area) layer
     * Docs: https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer
     */
    async getFloodZone(lat: number, lon: number): Promise<FloodData> {
        this.logger.log(`Fetching flood zone for (${lat}, ${lon})`);

        try {
            // FEMA uses Web Mercator (WKID 3857), but we can query with lat/lon in WKID 4326
            const params = new URLSearchParams({
                geometry: `${lon},${lat}`,
                geometryType: 'esriGeometryPoint',
                inSR: '4326', // WGS84 (lat/lon)
                spatialRel: 'esriSpatialRelIntersects',
                outFields: 'FLD_ZONE,ZONE_SUBTY,STATIC_BFE,SFHA_TF',
                returnGeometry: 'false',
                f: 'json',
            });

            const url = `${this.FEMA_NFHL_URL}?${params.toString()}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`FEMA API returned ${response.status}: ${response.statusText}`);
            }

            const data: FEMAResponse = await response.json();

            if (data.features && data.features.length > 0) {
                // Get the first matching flood zone
                const feature = data.features[0];
                const zone = feature.attributes.FLD_ZONE;
                const subtype = feature.attributes.ZONE_SUBTY;

                // Combine zone and subtype if available (e.g., "AE" or "A")
                const floodZoneCode = subtype ? `${zone}${subtype}` : zone;

                this.logger.log(`FEMA flood zone: ${floodZoneCode} (SFHA: ${feature.attributes.SFHA_TF})`);

                return {
                    floodZoneCode,
                    floodSource: 'FEMA NFHL (National Flood Hazard Layer)',
                };
            } else {
                // No flood hazard data found - likely Zone X (outside SFHA)
                this.logger.log('No SFHA found - likely Zone X (minimal flood hazard)');
                return {
                    floodZoneCode: 'X',
                    floodSource: 'FEMA NFHL (National Flood Hazard Layer)',
                };
            }
        } catch (error) {
            this.logger.error(`FEMA API error: ${error.message}`);
            return this.getFallbackFloodData();
        }
    }

    /**
     * Fallback to mock data if FEMA API fails
     */
    private getFallbackFloodData(): FloodData {
        this.logger.log('Using fallback flood data');

        // Most properties are in Zone X (minimal flood hazard)
        const zones = [
            { code: 'X', weight: 0.7 },
            { code: 'AE', weight: 0.15 },
            { code: 'A', weight: 0.1 },
            { code: 'D', weight: 0.05 },
        ];

        const random = Math.random();
        let cumulative = 0;
        let selectedZone = 'X';

        for (const zone of zones) {
            cumulative += zone.weight;
            if (random <= cumulative) {
                selectedZone = zone.code;
                break;
            }
        }

        return {
            floodZoneCode: selectedZone,
            floodSource: 'Fallback Data (FEMA API unavailable)',
        };
    }
}
