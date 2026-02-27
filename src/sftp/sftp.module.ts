import { Module } from "@nestjs/common";
import { SftpController } from "./sftp.controller";
import { SftpService } from "./sftp.service";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PortalSftp } from "./sftp.entity";
import { CryptoModule } from "crypto/crypto.module";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([PortalSftp]),
    CryptoModule,
  ],
  controllers: [SftpController],
  providers: [SftpService],
  exports: [SftpService],
})
export class SftpModule {}
