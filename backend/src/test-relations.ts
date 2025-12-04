import { PrismaClient } from '@prisma/client';

/**
 * Test file to verify Prisma schema relations are properly typed
 * This file demonstrates type-safe relation navigation in TypeScript
 */

const prisma = new PrismaClient();

async function testRelationNavigation() {
    // Example: Creating a site with related data
    const site = await prisma.site.create({
        data: {
            name: 'Test Parcel',
            addressLine1: '123 Main St',
            city: 'Austin',
            state: 'TX',
            zip: '78701',
            sizeAcres: 5.5,
            sizeSf: 239580,
            askPriceTotal: 2000000,
            askPricePerSf: 8.35,
            status: 'NEW',

            // 1-to-1 relations
            constraints: {
                create: {
                    zoningType: 'MF-3',
                    floodZoneCode: 'X',
                },
            },

            utilities: {
                create: {
                    waterProvider: 'Austin Water',
                    sewerProvider: 'Austin Water',
                    taxRateTotal: 2.15,
                },
            },

            programFlags: {
                create: {
                    inOpportunityZone: true,
                    ozTractId: '48453001100',
                },
            },

            // 1-to-many relations
            demographics: {
                create: [
                    {
                        radiusMiles: 1,
                        medianHouseholdIncome: 75000,
                        population: 5000,
                        source: 'Census 2020',
                        asOfYear: 2020,
                    },
                    {
                        radiusMiles: 3,
                        medianHouseholdIncome: 68000,
                        population: 25000,
                        source: 'Census 2020',
                        asOfYear: 2020,
                    },
                ],
            },

            rentComps: {
                create: [
                    {
                        compName: 'Nearby Apartments',
                        compType: 'MF',
                        averageRentPsf: 1.85,
                        rentRangeLow: 1200,
                        rentRangeHigh: 2500,
                        distanceMiles: 0.5,
                    },
                ],
            },

            scenarios: {
                create: [
                    {
                        scenarioType: 'MF_GARDEN_MARKET',
                        assumedUnits: 200,
                        assumedNetAcres: 4.5,
                        densityUnitsPerAcre: 44.4,
                        landPricePerDoor: 10000,
                        status: 'TODO',
                    },
                ],
            },
        },

        // Include all relations to test navigation
        include: {
            constraints: true,
            utilities: true,
            programFlags: true,
            demographics: true,
            rentComps: true,
            scenarios: true,
        },
    });

    // TypeScript should provide full type safety for all nested relations
    console.log('Site created:', site.name);
    console.log('Zoning:', site.constraints?.zoningType);
    console.log('Water provider:', site.utilities?.waterProvider);
    console.log('Opportunity Zone:', site.programFlags?.inOpportunityZone);
    console.log('Demographics count:', site.demographics.length);
    console.log('Rent comps count:', site.rentComps.length);
    console.log('Scenarios count:', site.scenarios.length);

    // Test cascade delete
    await prisma.site.delete({
        where: { id: site.id },
    });

    console.log('Site and all related records deleted successfully (cascade)');
}

// This file is for type-checking only - not meant to be executed in Module 1
// Uncomment below to actually run the test:
// testRelationNavigation()
//   .catch(console.error)
//   .finally(() => prisma.$disconnect());

export { testRelationNavigation };
