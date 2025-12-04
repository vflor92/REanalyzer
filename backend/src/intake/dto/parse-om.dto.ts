import { IsOptional, IsString } from 'class-validator';

export class ParseOmDto {
    @IsOptional()
    @IsString()
    listingUrl?: string;

    @IsOptional()
    @IsString()
    rawText?: string;

    // PDF file is handled via multer, not in DTO
}
