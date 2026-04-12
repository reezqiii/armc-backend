import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductionService } from "./production.service";
import { ProductionController } from "./production.controller";
import { ProductionBatch } from "./entities/production.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ProductionBatch])],
  controllers: [ProductionController],
  providers: [ProductionService],
})
export class ProductionModule {}
