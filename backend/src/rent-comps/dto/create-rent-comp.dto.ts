import { IsString, IsEnum, IsNumber, IsOptional, IsUrl, Min } from 'class-validator';
import { CompType } from '@prisma/client';

export class CreateRentCompDto {
    @IsString()
    compName: string;

    @IsEnum(CompType)
    compType: CompType;

    @IsNumber()
    @IsOptional()
    @Min(0)
    averageRentPsf?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    rentRangeLow?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    rentRangeHigh?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    distanceMiles?: number;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsUrl()
    @IsOptional()
    url?: string;
}
