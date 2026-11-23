import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Reserva API')
    .setDescription('The Reserva booking API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const outputPath = join(process.cwd(), 'openapi.json');

  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  console.log(`OpenAPI specification saved to ${outputPath}`);

  await app.close();
}

void generateOpenApi();
