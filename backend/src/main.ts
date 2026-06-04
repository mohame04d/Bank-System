import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    rawBody: true 
  });
  
  // Security
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors();
  
  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );

  // Body parser limits (preserve rawBody for Stripe Webhooks)
  app.use(
    express.json({
      limit: '50mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
