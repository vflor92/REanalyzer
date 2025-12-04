import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SiteStatus } from '@prisma/client';

export class QuerySitesDto {
    // Filtering
    @IsOptional()
    @IsEnum(SiteStatus)
    status?: SiteStatus;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    city?: string;

    // Sorting
    @IsOptional()
    @IsString()
    sortBy?: string; // name, city, state, status, sizeAcres, askPriceTotal, askPricePerSf, createdAt

    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC';

    // Pagination
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}
