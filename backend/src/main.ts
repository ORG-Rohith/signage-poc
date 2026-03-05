import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  // Set log levels based on environment
  const logLevels = process.env.LOG_LEVEL 
    ? process.env.LOG_LEVEL.split(',') as any[]
    : ['log', 'error', 'warn', 'debug'];

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  const logger = new Logger('Bootstrap');

  app.enableCors({ origin: '*' }); // For testing, allow all origins

  // ✅ Serve uploads folder correctly
  const uploadsPath = join(process.cwd(), 'uploads');

  logger.debug(`Serving uploads from: ${uploadsPath}`);
  logger.log(`Application is starting on port ${process.env.PORT ?? 3001}`);

  app.use('/uploads', express.static(uploadsPath));
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  
  logger.log(`Server listening on port ${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`Log level: ${process.env.LOG_LEVEL || 'debug,log,warn,error'}`);
}
bootstrap();
