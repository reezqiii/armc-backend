import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PortalProjectService } from "./portal_project.service";
import { PortalProjectController } from "./portal_project.controller";
import { PortalProject } from "./entities/portal_project.entity";
import { CryptoModule } from "crypto/crypto.module";

@Module({
  imports: [TypeOrmModule.forFeature([PortalProject]), CryptoModule],
  controllers: [PortalProjectController],
  providers: [PortalProjectService],
})
export class PortalProjectModule {}
