import { Global, Module } from "@nestjs/common";
import { EditionsController } from "./editions.controller";
import { EditionsService } from "./editions.service";

/**
 * Global : presque tous les modules ont besoin de résoudre « l'édition courante ».
 */
@Global()
@Module({
  controllers: [EditionsController],
  providers: [EditionsService],
  exports: [EditionsService],
})
export class EditionsModule {}
