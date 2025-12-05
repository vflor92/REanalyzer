import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';

// Mock Groq client
const mockGroq = {
    chat: {
        completions: {
            create: jest.fn(),
        },
    },
};

// Mock ConfigService
const mockConfigService = {
    get: jest.fn((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-key';
        return null;
    }),
};

describe('AiService', () => {
    let service: AiService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AiService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<AiService>(AiService);
        // Inject mock Groq client
        (service as any).groq = mockGroq;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('extractSiteData', () => {
        it('should successfully extract data from text', async () => {
            const mockResponse = {
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                name: { value: 'Test Site', confidence: 1, sourceSnippet: 'Name: Test Site' },
                                sizeAcres: { value: 10.5, confidence: 0.9, sourceSnippet: '10.5 acres' },
                                askPriceTotal: { value: 1000000, confidence: 0.8, sourceSnippet: '$1M' },
                            }),
                        },
                    },
                ],
            };

            mockGroq.chat.completions.create.mockResolvedValue(mockResponse as any);

            const result = await service.extractSiteData('Sample text');

            expect(result.name.value).toBe('Test Site');
            expect(result.sizeAcres.value).toBe(10.5);
            expect(result.askPriceTotal.value).toBe(1000000);
            expect(mockGroq.chat.completions.create).toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            mockGroq.chat.completions.create.mockRejectedValue(new Error('API Error'));

            await expect(service.extractSiteData('text')).rejects.toThrow('Failed to extract site data');
        });

        it('should validate and sanitize response', async () => {
            const mockResponse = {
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                name: { value: 'Test Site', confidence: 1, sourceSnippet: 'Name: Test Site' },
                                // Invalid email should lower confidence
                                brokerEmail: { value: 'invalid-email', confidence: 0.9, sourceSnippet: 'Email: invalid' },
                            }),
                        },
                    },
                ],
            };

            mockGroq.chat.completions.create.mockResolvedValue(mockResponse as any);

            const result = await service.extractSiteData('text');

            expect(result.brokerEmail.confidence).toBeLessThanOrEqual(0.5);
        });
    });
});
