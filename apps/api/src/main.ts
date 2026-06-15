import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3001);
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000');

  // ── Security middleware ────────────────────────────────────────
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          connectSrc: ["'self'", ...corsOrigins.split(',').map((o) => o.trim())],
          frameSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: isProduction
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
    }),
  );

  app.use(cookieParser());

  // ── CORS ──────────────────────────────────────────────────────
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Portal-Token'],
  });

  // ── Global prefix & versioning ────────────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ── Global validation pipe ─────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  // ── Global Exception Filter ────────────────────────────────────
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  // ── Swagger / OpenAPI ──────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CreatorOS API')
    .setDescription('AI-powered creator deal management platform API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: 'Portal token as Bearer <token>',
      },
      'PortalToken',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('creator-profile', 'Creator profile & onboarding')
    .addTag('health', 'Health check endpoints')
    .addTag('deals', 'Deal management')
    .addTag('contracts', 'Contract management & AI analysis')
    .addTag('invoices', 'Invoice management & payment tracking')
    .addTag('performance', 'Performance tracking & analytics')
    .addTag('brand-portal', 'Brand portal token management (creator-side)')
    .addTag('portal-public', 'Public brand portal (brand-side, token-authenticated)')
    .addTag('invisible-tax', 'Invisible tax & hidden cost analysis')
    .addTag('financial-runway', 'Financial runway projections')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'CreatorOS API Docs',
  });

  await app.listen(port);
  console.warn(`🚀 CreatorOS API running on http://localhost:${port}/api`);
  console.warn(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
