import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtStrategy } from "../jwt.strategy";
import { CryptoModule } from "../crypto/crypto.module";
import { PortalUserPermissionModule } from "portal_user_permission/user_permission.module";
import { User } from "portal_user_db/user.entity";
import { EmailModule } from "email/email.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || "development"}`,
    }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET") || "defaultSecret",
        signOptions: { expiresIn: "24h" },
      }),
    }),
    TypeOrmModule.forFeature([User]),
    CryptoModule,
    PortalUserPermissionModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
