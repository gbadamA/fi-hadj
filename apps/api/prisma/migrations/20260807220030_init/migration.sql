-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'COMMISSAIRE_GENERAL', 'COMMISSAIRE_ADJOINT_1', 'COMMISSAIRE_ADJOINT_2', 'RESPONSABLE_LOGISTIQUE', 'RESPONSABLE_COMMUNICATION', 'RESPONSABLE_PARTENARIATS_SPONSORING', 'RESPONSABLE_EXPOSITIONS', 'RESPONSABLE_ATELIERS_PANELS', 'RESPONSABLE_EVENEMENTIEL', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_RH', 'RESPONSABLE_IT');

-- CreateEnum
CREATE TYPE "RegistrationType" AS ENUM ('PARTICIPANT', 'EXPOSANT', 'SPONSOR');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REJETE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NON_APPLICABLE', 'EN_ATTENTE', 'PAYE', 'REMBOURSE');

-- CreateEnum
CREATE TYPE "Civility" AS ENUM ('M', 'MME', 'DR', 'PR', 'SE', 'CHEIKH', 'IMAM');

-- CreateEnum
CREATE TYPE "ProgramItemType" AS ENUM ('CEREMONIE', 'PANEL', 'ATELIER', 'EXPOSITION', 'GALA', 'PAUSE');

-- CreateEnum
CREATE TYPE "ObjectiveType" AS ENUM ('GENERAL', 'SPECIFIQUE');

-- CreateEnum
CREATE TYPE "SponsorLevel" AS ENUM ('PLATINE', 'OR', 'ARGENT', 'BRONZE', 'PARTENAIRE');

-- CreateEnum
CREATE TYPE "BudgetEntryType" AS ENUM ('RECETTE', 'DEPENSE');

-- CreateEnum
CREATE TYPE "StandStatus" AS ENUM ('LIBRE', 'RESERVE', 'ATTRIBUE', 'PAYE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('LOGO', 'IMAGE', 'DOCUMENT', 'GALERIE');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('BROUILLON', 'PUBLIE');

-- CreateTable
CREATE TABLE "Edition" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "heroSubtitle" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "venue" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Edition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promoter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "acronym" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Promoter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objective" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "type" "ObjectiveType" NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpectedResult" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExpectedResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubTheme" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "colorKey" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SubTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramItem" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "subThemeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProgramItemType" NOT NULL,
    "day" DATE NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "location" TEXT,
    "speakers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProgramItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prize" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sponsorName" TEXT,
    "laureate" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Prize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TargetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactProjection" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "onSite" INTEGER NOT NULL,
    "online" INTEGER NOT NULL,
    "trained" INTEGER NOT NULL,
    "directJobs" INTEGER NOT NULL,
    "indirectJobs" INTEGER NOT NULL,

    CONSTRAINT "ImpactProjection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgChartMember" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "holderName" TEXT,
    "missions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "role" "Role",
    "photoUrl" TEXT,
    "userId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrgChartMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "caption" TEXT,
    "section" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverUrl" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'BROUILLON',
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "RegistrationType" NOT NULL,
    "civility" "Civility" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "organization" TEXT,
    "position" TEXT,
    "targetCategoryId" TEXT,
    "message" TEXT,
    "activitySector" TEXT,
    "standSize" TEXT,
    "websiteUrl" TEXT,
    "sponsorLevel" "SponsorLevel",
    "status" "RegistrationStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NON_APPLICABLE',
    "reviewReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "badgeIssuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exhibitor" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "registrationId" TEXT,
    "companyName" TEXT NOT NULL,
    "activitySector" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "logoUrl" TEXT,
    "standNumber" TEXT,
    "standStatus" "StandStatus" NOT NULL DEFAULT 'RESERVE',
    "standFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exhibitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "SponsorLevel" NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetEntry" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "type" "BudgetEntryType" NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'XOF',
    "date" DATE NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Edition_year_key" ON "Edition"("year");

-- CreateIndex
CREATE INDEX "Edition_isCurrent_idx" ON "Edition"("isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Promoter_order_idx" ON "Promoter"("order");

-- CreateIndex
CREATE INDEX "Objective_editionId_type_order_idx" ON "Objective"("editionId", "type", "order");

-- CreateIndex
CREATE INDEX "ExpectedResult_editionId_order_idx" ON "ExpectedResult"("editionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_editionId_key" ON "Theme"("editionId");

-- CreateIndex
CREATE INDEX "SubTheme_themeId_order_idx" ON "SubTheme"("themeId", "order");

-- CreateIndex
CREATE INDEX "ProgramItem_editionId_day_startTime_idx" ON "ProgramItem"("editionId", "day", "startTime");

-- CreateIndex
CREATE INDEX "Prize_editionId_order_idx" ON "Prize"("editionId", "order");

-- CreateIndex
CREATE INDEX "TargetCategory_order_idx" ON "TargetCategory"("order");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactProjection_year_key" ON "ImpactProjection"("year");

-- CreateIndex
CREATE INDEX "OrgChartMember_editionId_order_idx" ON "OrgChartMember"("editionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SiteContent_key_key" ON "SiteContent"("key");

-- CreateIndex
CREATE INDEX "MediaAsset_type_section_idx" ON "MediaAsset"("type", "section");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_reference_key" ON "Registration"("reference");

-- CreateIndex
CREATE INDEX "Registration_editionId_status_idx" ON "Registration"("editionId", "status");

-- CreateIndex
CREATE INDEX "Registration_createdAt_idx" ON "Registration"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_editionId_type_email_key" ON "Registration"("editionId", "type", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_editionId_type_sequence_key" ON "Registration"("editionId", "type", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Exhibitor_registrationId_key" ON "Exhibitor"("registrationId");

-- CreateIndex
CREATE INDEX "Exhibitor_editionId_standStatus_idx" ON "Exhibitor"("editionId", "standStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Exhibitor_editionId_standNumber_key" ON "Exhibitor"("editionId", "standNumber");

-- CreateIndex
CREATE INDEX "Sponsor_editionId_level_order_idx" ON "Sponsor"("editionId", "level", "order");

-- CreateIndex
CREATE INDEX "BudgetEntry_editionId_type_date_idx" ON "BudgetEntry"("editionId", "type", "date");

-- CreateIndex
CREATE INDEX "ContactMessage_handled_createdAt_idx" ON "ContactMessage"("handled", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpectedResult" ADD CONSTRAINT "ExpectedResult_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTheme" ADD CONSTRAINT "SubTheme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramItem" ADD CONSTRAINT "ProgramItem_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramItem" ADD CONSTRAINT "ProgramItem_subThemeId_fkey" FOREIGN KEY ("subThemeId") REFERENCES "SubTheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgChartMember" ADD CONSTRAINT "OrgChartMember_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgChartMember" ADD CONSTRAINT "OrgChartMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_targetCategoryId_fkey" FOREIGN KEY ("targetCategoryId") REFERENCES "TargetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exhibitor" ADD CONSTRAINT "Exhibitor_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exhibitor" ADD CONSTRAINT "Exhibitor_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsor" ADD CONSTRAINT "Sponsor_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetEntry" ADD CONSTRAINT "BudgetEntry_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetEntry" ADD CONSTRAINT "BudgetEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
