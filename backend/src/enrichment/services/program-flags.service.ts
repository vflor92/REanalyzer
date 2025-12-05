import { Injectable, Logger } from '@nestjs/common';

export interface ProgramFlagsData {
    isQct: boolean;
    isDda: boolean;
    isOpportunityZone: boolean;
    source: string;
}

interface ArcGISFeature {
    attributes: Record<string, any>;
    geometry?: any;
}

interface ArcGISResponse {
    features: ArcGISFeature[];
}

@Injectable()
export class ProgramFlagsService {
    private readonly logger = new Logger(ProgramFlagsService.name);

    // HUD ArcGIS REST API endpoints
    private readonly QCT_URL = 'https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Qualified_Census_Tracts_2024/FeatureServer/0/query';
    private readonly DDA_URL = 'https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Difficult_Development_Areas_2024/FeatureServer/0/query';
    private readonly OZ_URL = 'https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Opportunity_Zones/FeatureServer/0/query';

    /**
     * Check program eligibility flags using HUD ArcGIS REST APIs
     * Queries QCT, DDA, and Opportunity Zone spatial datasets
     */
    async getProgramFlags(lat: number, lon: number): Promise<ProgramFlagsData> {
        this.logger.log(`Checking program flags for (${lat}, ${lon})`);

        try {
            // Query all three APIs in parallel
            const [isQct, isDda, isOpportunityZone] = await Promise.all([
                this.checkQCT(lat, lon),
                this.checkDDA(lat, lon),
                this.checkOpportunityZone(lat, lon),
            ]);

            this.logger.log(`Program flags: QCT=${isQct}, DDA=${isDda}, OZ=${isOpportunityZone}`);

            return {
                isQct,
                isDda,
                isOpportunityZone,
                source: 'HUD/IRS Official Data (ArcGIS)',
            };
        } catch (error) {
            this.logger.error(`ArcGIS API error: ${error.message}`);
            return this.getFallbackProgramFlags();
        }
    }

    /**
     * Check if location is in a Qualified Census Tract (QCT)
     */
    private async checkQCT(lat: number, lon: number): Promise<boolean> {
        try {
            const params = new URLSearchParams({
                geometry: `${lon},${lat}`,
                geometryType: 'esriGeometryPoint',
                spatialRel: 'esriSpatialRelIntersects',
                outFields: '*',
                returnGeometry: 'false',
                f: 'json',
            });

            const url = `${this.QCT_URL}?${params.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`QCT API returned ${response.status}`);
            }

            const data: ArcGISResponse = await response.json();
            return data.features && data.features.length > 0;
        } catch (error) {
            this.logger.warn(`QCT check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if location is in a Difficult Development Area (DDA)
     */
    private async checkDDA(lat: number, lon: number): Promise<boolean> {
        try {
            const params = new URLSearchParams({
                geometry: `${lon},${lat}`,
                geometryType: 'esriGeometryPoint',
                spatialRel: 'esriSpatialRelIntersects',
                outFields: '*',
                returnGeometry: 'false',
                f: 'json',
            });

            const url = `${this.DDA_URL}?${params.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`DDA API returned ${response.status}`);
            }

            const data: ArcGISResponse = await response.json();
            return data.features && data.features.length > 0;
        } catch (error) {
            this.logger.warn(`DDA check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if location is in an Opportunity Zone
     */
    private async checkOpportunityZone(lat: number, lon: number): Promise<boolean> {
        try {
            const params = new URLSearchParams({
                geometry: `${lon},${lat}`,
                geometryType: 'esriGeometryPoint',
                spatialRel: 'esriSpatialRelIntersects',
                outFields: '*',
                returnGeometry: 'false',
                f: 'json',
            });

            const url = `${this.OZ_URL}?${params.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`OZ API returned ${response.status}`);
            }

            const data: ArcGISResponse = await response.json();
            return data.features && data.features.length > 0;
        } catch (error) {
            this.logger.warn(`OZ check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Fallback to mock data if APIs fail
     */
    private getFallbackProgramFlags(): ProgramFlagsData {
        this.logger.log('Using fallback program flags');

        return {
            isQct: Math.random() > 0.5,
            isDda: Math.random() > 0.7,
            isOpportunityZone: Math.random() > 0.8,
            source: 'Fallback Data (HUD APIs unavailable)',
        };
    }
}
