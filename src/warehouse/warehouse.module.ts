import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WarehouseService } from "./warehouse.service";
import { WarehouseController } from "./warehouse.controller";
import { Warehouse } from "./entities/warehouse.entity";
import { AesEcbService } from "crypto/aes-ecb.service";

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse])],
  controllers: [WarehouseController],
  providers: [WarehouseService, AesEcbService],
})
export class WarehouseModule {}
