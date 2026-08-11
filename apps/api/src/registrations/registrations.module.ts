import { Module } from "@nestjs/common";
import { BadgeService } from "./badge.service";
import { RegistrationsController } from "./registrations.controller";
import { RegistrationsService } from "./registrations.service";

@Module({
  controllers: [RegistrationsController],
  providers: [RegistrationsService, BadgeService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
