import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { ParseOmResponse } from './dto/parse-om.dto';
import { createParsePrompt } from './prompts/parse-om.prompt';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private groq: Groq;

    constructor(private config: ConfigService) {
        const apiKey = this.config.get<string>('GROQ_API_KEY');
        if (!apiKey) {
            throw new Error('GROQ_API_KEY is not configured');
        }
        this.groq = new Groq({ apiKey });
    }

    /**
     * Extract site data from document text using LLM
     * Returns structured data with confidence scores and source snippets
     */
    async extractSiteData(documentText: string): Promise<ParseOmResponse> {
        try {
            this.logger.log(`Extracting site data from ${documentText.length} characters of text`);

            // Truncate if too long (Groq has ~32k token context)
            const maxChars = 100000; // ~25k tokens
            const text = documentText.length > maxChars
                ? documentText.substring(0, maxChars) + '\n\n[Document truncated...]'
                : documentText;

            const prompt = createParsePrompt(text);

            // Call Groq API with Llama 3.1 70B
            const completion = await this.groq.chat.completions.create({
                model: 'llama-3.1-70b-versatile',
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.1, // Low temperature for factual extraction
                max_tokens: 2048,
                response_format: { type: 'json_object' }, // Force JSON output
            });

            const responseText = completion.choices[0]?.message?.content;
            if (!responseText) {
                throw new Error('No response from Groq API');
            }

            this.logger.log('Received response from Groq API');

            // Parse the JSON response
            const parsed = JSON.parse(responseText) as ParseOmResponse;

            // Validate and sanitize the response
            const validated = this.validateAndSanitize(parsed);

            this.logger.log('Successfully extracted and validated site data');
            return validated;

        } catch (error) {
            this.logger.error('Error extracting site data:', error);
            throw new Error(`Failed to extract site data: ${error.message}`);
        }
    }

    /**
     * Validate and sanitize the AI response
     * Ensures numeric fields are valid, applies confidence thresholds
     */
    private validateAndSanitize(parsed: any): ParseOmResponse {
        const result: ParseOmResponse = {
            name: this.sanitizeField(parsed.name, 'string'),
            addressLine1: this.sanitizeField(parsed.addressLine1, 'string'),
            city: this.sanitizeField(parsed.city, 'string'),
            state: this.sanitizeField(parsed.state, 'string'),
            zip: this.sanitizeField(parsed.zip, 'string'),
            sizeAcres: this.sanitizeField(parsed.sizeAcres, 'number'),
            askPriceTotal: this.sanitizeField(parsed.askPriceTotal, 'number'),
            brokerName: this.sanitizeField(parsed.brokerName, 'string'),
            brokerCompany: this.sanitizeField(parsed.brokerCompany, 'string'),
            brokerEmail: this.sanitizeField(parsed.brokerEmail, 'string'),
            listingUrl: this.sanitizeField(parsed.listingUrl, 'string'),
            mudName: this.sanitizeField(parsed.mudName, 'string'),
            detentionNotes: this.sanitizeField(parsed.detentionNotes, 'string'),
            deedRestrictionsText: this.sanitizeField(parsed.deedRestrictionsText, 'string'),
        };

        // Additional validation for specific fields
        if (result.brokerEmail.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(result.brokerEmail.value)) {
                this.logger.warn(`Invalid email format: ${result.brokerEmail.value}`);
                result.brokerEmail.confidence = Math.min(result.brokerEmail.confidence, 0.5);
            }
        }

        return result;
    }

    /**
     * Sanitize individual field from AI response
     */
    private sanitizeField(field: any, expectedType: 'string' | 'number'): any {
        // Default empty field
        const emptyField = {
            value: null,
            sourceSnippet: null,
            confidence: 0,
        };

        // Check if field exists and has the expected structure
        if (!field || typeof field !== 'object') {
            return emptyField;
        }

        const { value, sourceSnippet, confidence } = field;

        // Validate confidence
        const validConfidence = typeof confidence === 'number'
            ? Math.max(0, Math.min(1, confidence))
            : 0;

        // Type-specific validation
        if (expectedType === 'number') {
            const numValue = Number(value);
            if (value === null || value === undefined || isNaN(numValue)) {
                return emptyField;
            }
            return {
                value: numValue,
                sourceSnippet: sourceSnippet || null,
                confidence: validConfidence,
            };
        }

        // String validation
        if (expectedType === 'string') {
            if (value === null || value === undefined || value === '') {
                return emptyField;
            }
            return {
                value: String(value).trim(),
                sourceSnippet: sourceSnippet || null,
                confidence: validConfidence,
            };
        }

        return emptyField;
    }
}
