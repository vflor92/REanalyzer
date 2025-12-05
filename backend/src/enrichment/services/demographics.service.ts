import { Injectable, Logger } from '@nestjs/common';

export interface DemographicData {
    medianHouseholdIncome: number | null;
    population: number | null;
    source: string;
    asOfYear: number;
}

interface CensusGeocoderResponse {
    result: {
        geographies: {
            'Census Tracts': Array<{
                GEOID: string;
                NAME: string;
                STATE: string;
                COUNTY: string;
                TRACT: string;
            }>;
        };
    };
}

type ACSResponse = string[][];

@Injectable()
export class DemographicsService {
    private readonly logger = new Logger(DemographicsService.name);
    private readonly CENSUS_GEOCODER_URL = 'https://geocoding.geo.census.gov/geocoder/geographies/coordinates';
    private readonly ACS_API_URL = 'https://api.census.gov/data/2022/acs/acs5';

    /**
     * Get demographic data for a given location and radius
     * Uses Census Geocoder API + ACS 5-Year estimates
     */
    async getDemographics(
        lat: number,
        lon: number,
        radiusMiles: number,
    ): Promise<DemographicData> {
        this.logger.log(
            `Fetching demographics for (${lat}, ${lon}) at ${radiusMiles} mile radius`,
        );

        try {
            // Step 1: Get census tract FIPS code from coordinates
            const tractFips = await this.getCensusTract(lat, lon);

            if (!tractFips) {
                this.logger.warn('Could not determine census tract, using fallback');
                return this.getFallbackDemographics(radiusMiles);
            }

            // Step 2: Query ACS 5-Year API for demographics
            const demographics = await this.getACSData(tractFips);

            if (!demographics.medianHouseholdIncome && !demographics.population) {
                this.logger.warn('No ACS data found, using fallback');
                return this.getFallbackDemographics(radiusMiles);
            }

            this.logger.log(
                `Census data: MHI=$${demographics.medianHouseholdIncome}, Pop=${demographics.population}`,
            );

            return {
                medianHouseholdIncome: demographics.medianHouseholdIncome,
                population: demographics.population,
                source: 'US Census Bureau (ACS 5-Year 2022)',
                asOfYear: 2022,
            };
        } catch (error) {
            this.logger.error(`Census API error: ${error.message}`);
            return this.getFallbackDemographics(radiusMiles);
        }
    }

    /**
     * Get census tract FIPS code from lat/lon using Census Geocoder API
     */
    private async getCensusTract(lat: number, lon: number): Promise<string | null> {
        try {
            const url = `${this.CENSUS_GEOCODER_URL}?x=${lon}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Census Geocoder returned ${response.status}`);
            }

            const data: CensusGeocoderResponse = await response.json();

            const tracts = data?.result?.geographies?.['Census Tracts'];
            if (tracts && tracts.length > 0) {
                const geoid = tracts[0].GEOID;
                this.logger.log(`Found census tract: ${geoid}`);
                return geoid;
            }

            return null;
        } catch (error) {
            this.logger.error(`Census Geocoder error: ${error.message}`);
            return null;
        }
    }

    /**
     * Get ACS 5-Year demographic data for a census tract
     * Variables:
     * - B19013_001E: Median Household Income
     * - B01003_001E: Total Population
     */
    private async getACSData(tractFips: string): Promise<{
        medianHouseholdIncome: number | null;
        population: number | null;
    }> {
        try {
            // Extract state and county from FIPS (format: SSCCCTTTTTT)
            const state = tractFips.substring(0, 2);
            const county = tractFips.substring(2, 5);
            const tract = tractFips.substring(5);

            const url = `${this.ACS_API_URL}?get=NAME,B19013_001E,B01003_001E&for=tract:${tract}&in=state:${state}+county:${county}`;

            this.logger.log(`Querying ACS API: state=${state}, county=${county}, tract=${tract}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`ACS API returned ${response.status}`);
            }

            const data: ACSResponse = await response.json();

            // ACS returns an array where first row is headers, second row is data
            if (data && data.length > 1) {
                const [headers, values] = data;
                const nameIdx = headers.indexOf('NAME');
                const incomeIdx = headers.indexOf('B19013_001E');
                const popIdx = headers.indexOf('B01003_001E');

                const tractName = values[nameIdx];
                const income = values[incomeIdx] !== '-666666666' ? parseInt(values[incomeIdx], 10) : null;
                const population = values[popIdx] !== '-666666666' ? parseInt(values[popIdx], 10) : null;

                this.logger.log(`ACS data for ${tractName}: MHI=$${income}, Pop=${population}`);

                return {
                    medianHouseholdIncome: income,
                    population: population,
                };
            }

            return { medianHouseholdIncome: null, population: null };
        } catch (error) {
            this.logger.error(`ACS API error: ${error.message}`);
            return { medianHouseholdIncome: null, population: null };
        }
    }

    /**
     * Fallback to mock data if Census APIs fail
     */
    private getFallbackDemographics(radiusMiles: number): DemographicData {
        this.logger.log(`Using fallback demographics for ${radiusMiles} mile radius`);

        const baseMhhi = 75000;
        const basePopulation = 50000;
        const radiusMultiplier = radiusMiles === 3 ? 1.5 : 1.0;
        const randomFactor = 0.9 + Math.random() * 0.2;

        return {
            medianHouseholdIncome: Math.round(baseMhhi * radiusMultiplier * randomFactor),
            population: Math.round(basePopulation * radiusMultiplier * randomFactor),
            source: 'Fallback Data (Census API unavailable)',
            asOfYear: 2022,
        };
    }
}
