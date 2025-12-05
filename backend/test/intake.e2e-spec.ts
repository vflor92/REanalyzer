import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { IntakeService } from './../src/intake/intake.service';

describe('IntakeController (e2e)', () => {
    let app: INestApplication;
    let intakeService: IntakeService;

    const mockResponse = {
        name: { value: 'Test Site', confidence: 1, sourceSnippet: 'Name: Test Site' },
        sizeAcres: { value: 10, confidence: 1, sourceSnippet: '10 acres' },
        askPriceTotal: { value: 1000000, confidence: 1, sourceSnippet: '$1M' },
    };

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(IntakeService)
            .useValue({
                parseDocument: jest.fn().mockResolvedValue(mockResponse),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        // Match main.ts validation pipe config
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        await app.init();

        intakeService = moduleFixture.get<IntakeService>(IntakeService);
    });

    afterAll(async () => {
        await app.close();
    });

    it('/intake/parse-om (POST) - with text', () => {
        return request(app.getHttpServer())
            .post('/intake/parse-om')
            .field('rawText', 'Sample text')
            .expect(201)
            .expect((res) => {
                expect(res.body.name.value).toBe('Test Site');
                expect(intakeService.parseDocument).toHaveBeenCalledWith(undefined, undefined, 'Sample text');
            });
    });

    it('/intake/parse-om (POST) - with file', () => {
        const buffer = Buffer.from('dummy content');
        return request(app.getHttpServer())
            .post('/intake/parse-om')
            .attach('file', buffer, 'test.pdf')
            .expect(201)
            .expect((res) => {
                expect(res.body.name.value).toBe('Test Site');
                // Check that parseDocument was called with a file object
                expect(intakeService.parseDocument).toHaveBeenCalled();
                const args = (intakeService.parseDocument as jest.Mock).mock.calls[0];
                expect(args[0]).toBeDefined(); // file
                expect(args[0].originalname).toBe('test.pdf');
            });
    });
});
