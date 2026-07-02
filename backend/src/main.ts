import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS so your Next.js frontend can talk to the NestJS backend
  app.enableCors();

  // Add this line to automatically intercept bad frontend payloads!
  app.useGlobalPipes(new ValidationPipe());
  
  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`🚀 Server running on: http://localhost:${port}`);
}
bootstrap();