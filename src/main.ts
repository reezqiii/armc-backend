import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { requestStorage } from 'portal_request_user_permission/subscribers/async_local_storage';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ---- FIX PENTING: START ALS CONTEXT ----
  app.use((req, res, next) => {
    requestStorage.run({ userId: null }, () => {
      next();
    });
  });

  app.enableCors({
    origin: '*', // Ganti '*' dengan origin yang diizinkan bila perlu
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Jika Anda perlu mengizinkan cookie dan credentials lainnya
  });

  const config = new DocumentBuilder()
    .setTitle('API Example')
    .setDescription('API description for the NestJS application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan JWT tanpa "Bearer " (Swagger akan menambahkannya otomatis)',
      },
      'access-token', // nama ini adalah key/identifier, bebas tapi konsisten
    )
    .addTag('api')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalGuards(new JwtAuthGuard(new Reflector()));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
