import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { ParseOmResponse } from '../ai/dto/parse-om.dto';

@Injectable()
export class IntakeService {
    private readonly logger = new Logger(IntakeService.name);

    constructor(private aiService: AiService) { }

    /**
     * Parse a document (PDF, URL, or raw text) to extract site data
     * Returns ParseOmResponse with AI suggestions - does NOT write to database
     */
    async parseDocument(
        file?: Express.Multer.File,
        url?: string,
        rawText?: string,
    ): Promise<ParseOmResponse> {
        let documentText: string;

        // Priority: PDF file > raw text > URL
        if (file) {
            this.logger.log(`Parsing PDF file: ${file.originalname}`);
            documentText = await this.extractTextFromPdf(file.buffer);
        } else if (rawText) {
            this.logger.log('Using provided raw text');
            documentText = rawText;
        } else if (url) {
            this.logger.log(`Scraping URL: ${url}`);
            // URL scraping not implemented yet - Phase 2
            throw new BadRequestException(
                'URL scraping not yet implemented. Please upload a PDF or provide raw text.',
            );
        } else {
            throw new BadRequestException(
                'Must provide either a PDF file, rawText, or listingUrl',
            );
        }

        if (!documentText || documentText.trim().length < 50) {
            throw new BadRequestException(
                'Document text is too short or empty. Please provide a valid document.',
            );
        }

        this.logger.log(`Extracted ${documentText.length} characters of text`);

        // Use AI service to extract structured data
        const parsed = await this.aiService.extractSiteData(documentText);

        return parsed;
    }

    /**
   * Extract text from PDF buffer using pdf-parse
   */
    private async extractTextFromPdf(buffer: Buffer): Promise<string> {
        try {
            // Use require for CommonJS module (pdf-parse v1.1.1)
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(buffer);
            return data.text;
        } catch (error) {
            this.logger.error('Error parsing PDF:', error);
            throw new BadRequestException(
                `Failed to parse PDF: ${error.message}. Ensure the file is a valid PDF.`,
            );
        }
    }
}
