import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";

async function bootstrap() {
  process.env.TZ = process.env.TZ || "Asia/Jakarta";

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const basePath = configService.get<string>("NEST_BASE_PATH");

  app.setGlobalPrefix(`${basePath}`);

  const rawCors = configService.get<string>("CORS");
  const corsList = JSON.parse(rawCors);

  const whitelist = corsList.map((item) => {
    if (item.startsWith("^")) {
      return new RegExp(item);
    }
    return item;
  });

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowed = whitelist.some((item) => {
        if (typeof item === "string") {
          return item === origin;
        }

        return item.test(origin); // regex match
      });

      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Jika Anda perlu mengizinkan cookie dan credentials lainnya
  });

  const config = new DocumentBuilder()
    .setTitle("API Example")
    .setDescription("API description for the NestJS application")
    .setVersion("1.0")
    .addTag("api")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          'Masukkan JWT tanpa "Bearer " (Swagger akan menambahkannya otomatis)',
      },
      "access-token", // nama ini adalah key/identifier, bebas tapi konsisten
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${basePath}/docs`, app, document);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  ); // security headers
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
