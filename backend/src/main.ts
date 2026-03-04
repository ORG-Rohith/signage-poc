import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    // app.enableCors();
// app.enableCors({
//   origin: [
//     // 'http://localhost:3000',
//     // 'http://192.168.0.108:3000',

//   ],
//   credentials: true,
// });
  // app.enableCors({
  //   origin: true, // allow all origins (for testing)
  // });

    app.enableCors({ origin: '*' }); // For testing, allow all origins

// ✅ Serve uploads folder correctly
  const uploadsPath = join(process.cwd(), 'uploads');

  console.log('Serving uploads from:', uploadsPath);

  app.use('/uploads', express.static(uploadsPath));
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
