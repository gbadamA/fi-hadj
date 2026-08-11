import { Module } from "@nestjs/common";
import { ContentService } from "./content.service";
import {
  ExpectedResultsController,
  HomeController,
  ImpactProjectionsController,
  ObjectivesController,
  OrgChartController,
  PrizesController,
  ProgramItemsController,
  PromotersController,
  SiteContentController,
  SubThemesController,
  TargetCategoriesController,
  ThemesController,
} from "./content.controllers";

@Module({
  controllers: [
    HomeController,
    PromotersController,
    ObjectivesController,
    ExpectedResultsController,
    ThemesController,
    SubThemesController,
    ProgramItemsController,
    PrizesController,
    TargetCategoriesController,
    ImpactProjectionsController,
    OrgChartController,
    SiteContentController,
  ],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
