import {
    Controller,
    Post,
    Body,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IntakeService } from './intake.service';
import { ParseOmDto } from './dto/parse-om.dto';
import { ParseOmResponse } from '../ai/dto/parse-om.dto';

@Controller('intake')
export class IntakeController {
    constructor(private readonly intakeService: IntakeService) { }

    /**
     * POST /intake/parse-om
     * Parse an OM document (PDF, URL, or raw text) to extract site data
     * 
     * Accepts:
     * - multipart/form-data with 'file' (PDF)
     * - application/json with { listingUrl, rawText }
     * 
     * Returns: ParseOmResponse with suggested values
     * 
     * IMPORTANT: This endpoint does NOT write to the database.
     * It only returns AI-extracted suggestions for user review.
     */
    @Post('parse-om')
    @UseInterceptors(FileInterceptor('file'))
    async parseOm(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: ParseOmDto,
    ): Promise<ParseOmResponse> {
        // Validate file size if uploaded (10MB limit)
        if (file && file.size > 10 * 1024 * 1024) {
            throw new BadRequestException('File size exceeds 10MB limit');
        }

        // Validate file type if uploaded
        if (file && file.mimetype !== 'application/pdf') {
            throw new BadRequestException('Only PDF files are supported');
        }

        return this.intakeService.parseDocument(
            file,
            dto.listingUrl,
            dto.rawText,
        );
    }
}
