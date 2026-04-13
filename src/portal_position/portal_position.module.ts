import { TypeOrmModule } from "@nestjs/typeorm";
import { Position } from "./entities/portal_position.entity";
import { PortalPositionController } from "./portal_position.controller";
import { PortalPositionService } from "./portal_position.service";
import { Module } from "@nestjs/common";
import { CryptoModule } from "crypto/crypto.module";

@Module({
  imports: [TypeOrmModule.forFeature([Position]), CryptoModule],
  controllers: [PortalPositionController],
  providers: [PortalPositionService],
})
export class PortalPositionModule {}
