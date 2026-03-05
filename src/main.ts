import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { requestStorage } from "portal_request_user_permission/subscribers/async_local_storage";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);


  app.useStaticAssets(join(__dirname, "..", "public"), {
    prefix: "/",
  });

  app.use((req, res, next) => {
    requestStorage.run({ userId: null }, () => {
      next();
    });
  });

  app.enableCors({
    origin: "*", // Ganti '*' dengan origin yang diizinkan bila perlu
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Jika Anda perlu mengizinkan cookie dan credentials lainnya
  });

  const config = new DocumentBuilder()
    .setTitle("API Example")
    .setDescription("API description for the NestJS application")
    .setVersion("1.0")
    .addTag("api")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  app.useGlobalGuards(new JwtAuthGuard(new Reflector()));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
