import { IsString, IsNotEmpty, IsEmail, IsOptional, IsNumber, IsPositive, IsEnum, ValidateNested, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { SiteStatus } from '@prisma/client';

// Nested DTOs for one-to-one relations
export class CreateSiteConstraintsDto {
    @IsOptional()
    @IsBoolean()
    detentionRequired?: boolean;

    @IsOptional()
    @IsString()
    detentionNotes?: string;

    @IsOptional()
    @IsDateString()
    canBreakGroundAfter?: string;

    @IsOptional()
    @IsString()
    zoningType?: string;

    @IsOptional()
    @IsString()
    deedRestrictionsText?: string;

    @IsOptional()
    @IsString()
    floodZoneCode?: string;

    @IsOptional()
    @IsString()
    floodSource?: string;

    @IsOptional()
    @IsString()
    schoolDistrictName?: string;

    @IsOptional()
    @IsString()
    schoolDistrictRatingSource?: string;

    @IsOptional()
    @IsString()
    schoolDistrictRatingValue?: string;
}

export class CreateSiteUtilitiesDto {
    @IsOptional()
    @IsString()
    waterProvider?: string;

    @IsOptional()
    @IsString()
    sewerProvider?: string;

    @IsOptional()
    @IsString()
    mudName?: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    taxRateTotal?: number;

    @IsOptional()
    @IsString()
    taxRateSourceUrl?: string;

    @IsOptional()
    @IsDateString()
    taxRateLastCheckedAt?: string;
}

// Main Site DTO
export class CreateSiteDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    addressLine1: string;

    @IsNotEmpty()
    @IsString()
    city: string;

    @IsNotEmpty()
    @IsString()
    state: string;

    @IsNotEmpty()
    @IsString()
    zip: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    @IsOptional()
    @IsString()
    county?: string;

    @IsOptional()
    @IsString()
    ahj?: string;

    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    sizeAcres: number;

    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    askPriceTotal: number;

    @IsOptional()
    @IsString()
    brokerName?: string;

    @IsOptional()
    @IsString()
    brokerCompany?: string;

    @IsOptional()
    @IsEmail()
    brokerEmail?: string;

    @IsOptional()
    @IsString()
    listingUrl?: string;

    @IsOptional()
    @IsEnum(SiteStatus)
    status?: SiteStatus;

    @IsOptional()
    @IsString()
    notesInternal?: string;

    // Nested relations
    @IsOptional()
    @ValidateNested()
    @Type(() => CreateSiteConstraintsDto)
    constraints?: CreateSiteConstraintsDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateSiteUtilitiesDto)
    utilities?: CreateSiteUtilitiesDto;
}
