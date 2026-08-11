import { Controller, Delete, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { editionSchema } from "@fihadj/shared-types";
import { ApiZodBody, ZBody } from "../common/zod/zod";
import { Public, RequireModule } from "../common/decorators/auth.decorators";
import { EditionsService } from "./editions.service";

@ApiTags("editions")
@Controller("editions")
export class EditionsController {
  constructor(private readonly editions: EditionsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Liste des éditions du forum" })
  findAll() {
    return this.editions.findAll();
  }

  @Public()
  @Get("current")
  @ApiOperation({ summary: "Édition courante — point d'entrée du site public" })
  findCurrent() {
    return this.editions.findCurrent();
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.editions.findOne(id);
  }

  @RequireModule("editions")
  @Post()
  @ApiZodBody(editionSchema)
  create(@ZBody(editionSchema) dto: never) {
    return this.editions.create(dto);
  }

  @RequireModule("editions")
  @Patch(":id")
  @ApiZodBody(editionSchema.partial())
  update(@Param("id") id: string, @ZBody(editionSchema.partial()) dto: never) {
    return this.editions.update(id, dto);
  }

  @RequireModule("editions")
  @Post(":id/set-current")
  @ApiOperation({ summary: "Désigne l'édition affichée par le site public" })
  setCurrent(@Param("id") id: string) {
    return this.editions.setCurrent(id);
  }

  @RequireModule("editions")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return this.editions.remove(id);
  }
}
