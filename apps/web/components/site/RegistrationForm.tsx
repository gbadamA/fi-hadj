"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Handshake, Loader2, UserRound } from "lucide-react";
import {
  CIVILITIES,
  CIVILITY_LABELS,
  SPONSOR_LEVELS,
  SPONSOR_LEVEL_LABELS,
  exhibitorRegistrationSchema,
  participantRegistrationSchema,
  sponsorRegistrationSchema,
  type Civility,
  type RegistrationType,
  type SponsorLevel,
  type TargetCategory,
} from "@fihadj/shared-types";
import { api, type ApiClientError } from "@/lib/api-client";
import { Button, Card, cx } from "@/components/ui/primitives";
import { Checkbox, Field, FormAlert, Input, Select, Textarea } from "@/components/ui/form";

/**
 * Trois parcours d'inscription (cahier §4) dans un seul écran à onglets.
 *
 * Chaque onglet valide avec le schéma Zod de `@fihadj/shared-types` — le MÊME
 * que celui du DTO côté API. Une règle changée sur le serveur est appliquée ici
 * sans qu'on ait à y penser.
 */
const TABS: {
  type: RegistrationType;
  label: string;
  hint: string;
  Icon: typeof UserRound;
  color: string;
}[] = [
  {
    type: "PARTICIPANT",
    label: "Participant / Visiteur",
    hint: "Assister aux panels, aux ateliers et visiter l'exposition.",
    Icon: UserRound,
    color: "#2E7CB8",
  },
  {
    type: "EXPOSANT",
    label: "Exposant",
    hint: "Réserver un stand dans le village d'exposition.",
    Icon: Building2,
    color: "#0E9F6E",
  },
  {
    type: "SPONSOR",
    label: "Sponsor / Partenaire",
    hint: "Soutenir le forum et bénéficier des contreparties associées.",
    Icon: Handshake,
    color: "#C9A227",
  },
];

const SCHEMAS = {
  PARTICIPANT: participantRegistrationSchema,
  EXPOSANT: exhibitorRegistrationSchema,
  SPONSOR: sponsorRegistrationSchema,
} as const;

/**
 * Union des champs des trois parcours.
 *
 * Le formulaire est typé sur ce SURENSEMBLE plutôt que sur l'union discriminée
 * des schémas : `register("activitySector")` doit compiler même quand l'onglet
 * actif est « Participant ». La validation réelle, elle, reste celle du schéma
 * de l'onglet courant — c'est le résolveur qui tranche, pas le typage.
 */
interface RegistrationFormValues {
  type: RegistrationType;
  civility: Civility;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  organization?: string;
  position?: string;
  targetCategoryId?: string;
  message?: string;
  activitySector?: string;
  standSize?: string;
  websiteUrl?: string;
  sponsorLevel?: SponsorLevel;
  consent: boolean;
}

interface Success {
  reference: string;
  email: string;
}

export function RegistrationForm({
  categories,
  registrationOpen,
}: {
  categories: TargetCategory[];
  registrationOpen: boolean;
}) {
  const [type, setType] = useState<RegistrationType>("PARTICIPANT");
  const [success, setSuccess] = useState<Success | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const defaults: RegistrationFormValues = {
    type,
    civility: "M",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Côte d'Ivoire",
    consent: false,
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    // Le résolveur est reconstruit à chaque changement d'onglet ; la conversion
    // est nécessaire parce que le schéma actif ne couvre qu'un sous-ensemble des
    // champs déclarés dans `RegistrationFormValues`.
    resolver: zodResolver(SCHEMAS[type]) as unknown as Resolver<RegistrationFormValues>,
    defaultValues: defaults,
    // Les champs démontés (secteur d'activité quand on quitte « Exposant ») ne
    // doivent plus être ni validés ni envoyés.
    shouldUnregister: true,
  });

  const fieldError = (name: keyof RegistrationFormValues): string | undefined =>
    errors[name]?.message as string | undefined;

  function switchTab(next: RegistrationType) {
    setType(next);
    setGlobalError(null);
    // On repart d'un formulaire propre : les champs propres à l'onglet quitté
    // n'ont plus de sens.
    reset({ ...defaults, type: next });
  }

  async function onSubmit(values: RegistrationFormValues) {
    setGlobalError(null);
    try {
      const created = await api.post<{ reference: string; email: string }>("/registrations", {
        ...values,
        type,
      });
      setSuccess({ reference: created.reference, email: created.email });
    } catch (error) {
      const apiError = error as ApiClientError;
      setGlobalError(
        apiError.status === 429
          ? "Trop de demandes envoyées depuis cette connexion. Réessayez dans une heure."
          : apiError.message,
      );
    }
  }

  if (!registrationOpen) {
    return (
      <FormAlert tone="info" title="Les inscriptions sont closes pour cette édition.">
        Le Commissariat Général annoncera l&apos;ouverture des inscriptions de la prochaine édition
        sur cette page.
      </FormAlert>
    );
  }

  if (success) {
    return (
      <Card className="text-center">
        <p className="text-caption font-semibold uppercase tracking-widest text-secondary">
          Demande enregistrée
        </p>
        <h2 className="mt-3 font-display text-h1">Merci, votre demande est bien reçue.</h2>
        <p className="mx-auto mt-4 max-w-xl text-body text-light-muted dark:text-dark-muted">
          Conservez la référence ci-dessous : elle vous sera demandée à l&apos;accueil. Un accusé de
          réception vient d&apos;être envoyé à <strong>{success.email}</strong>. Votre badge vous
          parviendra par email dès la validation par le Commissariat Général.
        </p>
        <p className="mx-auto mt-6 inline-block rounded-md border border-secondary bg-secondary/10 px-6 py-3 font-display text-2xl font-bold tracking-widest text-primary">
          {success.reference}
        </p>
        <div className="mt-8">
          <Button variant="ghost" onClick={() => setSuccess(null)}>
            Inscrire une autre personne
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div role="tablist" aria-label="Type d'inscription" className="grid gap-3 sm:grid-cols-3">
        {TABS.map((tab) => {
          const active = tab.type === type;
          return (
            <button
              key={tab.type}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => switchTab(tab.type)}
              className={cx(
                "rounded-md border p-4 text-left transition",
                active
                  ? "border-transparent shadow-card"
                  : "border-light-border hover:border-primary dark:border-dark-border",
              )}
              style={active ? { backgroundColor: `${tab.color}14`, borderColor: tab.color } : undefined}
            >
              <tab.Icon className="h-5 w-5" style={{ color: tab.color }} aria-hidden />
              <span className="mt-2 block font-medium">{tab.label}</span>
              <span className="mt-1 block text-caption text-light-muted dark:text-dark-muted">
                {tab.hint}
              </span>
            </button>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, () => {
          // Filet de sécurité : si une erreur porte sur un champ sans rendu
          // visible, l'utilisateur verrait le bouton ne rien faire. Un message
          // global garantit qu'un refus de validation se voit toujours.
          setGlobalError("Certains champs sont invalides. Vérifiez les mentions en rouge.");
        })}
        className="mt-8 space-y-6"
        noValidate
      >
        {/*
          `type` n'a pas de champ visible, mais il est requis par le schéma
          (`z.literal("EXPOSANT")`…). Avec `shouldUnregister`, React Hook Form
          retire du corps soumis toute valeur sans input monté : sans ce champ
          caché, la validation échouait sur `type` — sans erreur affichable,
          donc en silence.
        */}
        <input type="hidden" {...register("type")} />

        {globalError && <FormAlert tone="error" title={globalError} />}

        <fieldset className="space-y-5">
          <legend className="mb-3 font-display text-h3">Identité</legend>
          <div className="grid gap-5 sm:grid-cols-[160px_1fr_1fr]">
            <Field label="Civilité" htmlFor="civility" required error={fieldError("civility")}>
              <Select id="civility" invalid={Boolean(fieldError("civility"))} {...register("civility")}>
                {CIVILITIES.map((civility) => (
                  <option key={civility} value={civility}>
                    {CIVILITY_LABELS[civility]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prénom" htmlFor="firstName" required error={fieldError("firstName")}>
              <Input id="firstName" autoComplete="given-name" invalid={Boolean(fieldError("firstName"))} {...register("firstName")} />
            </Field>
            <Field label="Nom" htmlFor="lastName" required error={fieldError("lastName")}>
              <Input id="lastName" autoComplete="family-name" invalid={Boolean(fieldError("lastName"))} {...register("lastName")} />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Adresse email" htmlFor="email" required error={fieldError("email")}>
              <Input id="email" type="email" autoComplete="email" invalid={Boolean(fieldError("email"))} {...register("email")} />
            </Field>
            <Field
              label="Téléphone"
              htmlFor="phone"
              required
              hint="Avec l'indicatif pays"
              error={fieldError("phone")}
            >
              <Input id="phone" type="tel" autoComplete="tel" placeholder="+225 07 07 07 07 07" invalid={Boolean(fieldError("phone"))} {...register("phone")} />
            </Field>
            <Field label="Pays" htmlFor="country" required error={fieldError("country")}>
              <Input id="country" autoComplete="country-name" invalid={Boolean(fieldError("country"))} {...register("country")} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-3 font-display text-h3">
            {type === "PARTICIPANT" ? "Organisation (facultatif)" : "Organisation"}
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label={type === "PARTICIPANT" ? "Organisation" : "Raison sociale"}
              htmlFor="organization"
              required={type !== "PARTICIPANT"}
              error={fieldError("organization")}
            >
              <Input id="organization" autoComplete="organization" invalid={Boolean(fieldError("organization"))} {...register("organization")} />
            </Field>
            <Field label="Fonction" htmlFor="position" error={fieldError("position")}>
              <Input id="position" autoComplete="organization-title" {...register("position")} />
            </Field>
          </div>

          {type === "EXPOSANT" && (
            <div className="grid gap-5 sm:grid-cols-3">
              <Field
                label="Secteur d'activité"
                htmlFor="activitySector"
                required
                error={fieldError("activitySector")}
              >
                <Input id="activitySector" placeholder="Agence de voyage, compagnie aérienne…" invalid={Boolean(fieldError("activitySector"))} {...register("activitySector")} />
              </Field>
              <Field
                label="Surface de stand souhaitée"
                htmlFor="standSize"
                hint="Sous réserve de disponibilité"
                error={fieldError("standSize")}
              >
                <Input id="standSize" placeholder="12 m²" {...register("standSize")} />
              </Field>
              <Field label="Site web" htmlFor="websiteUrl" error={fieldError("websiteUrl")}>
                <Input id="websiteUrl" type="url" placeholder="https://" invalid={Boolean(fieldError("websiteUrl"))} {...register("websiteUrl")} />
              </Field>
            </div>
          )}

          {type === "SPONSOR" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Niveau de partenariat souhaité"
                htmlFor="sponsorLevel"
                required
                error={fieldError("sponsorLevel")}
              >
                <Select id="sponsorLevel" invalid={Boolean(fieldError("sponsorLevel"))} {...register("sponsorLevel")}>
                  <option value="">Sélectionner…</option>
                  {SPONSOR_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {SPONSOR_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Site web" htmlFor="websiteUrl" error={fieldError("websiteUrl")}>
                <Input id="websiteUrl" type="url" placeholder="https://" invalid={Boolean(fieldError("websiteUrl"))} {...register("websiteUrl")} />
              </Field>
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-3 font-display text-h3">Votre profil</legend>
          <Field
            label="Catégorie qui vous correspond"
            htmlFor="targetCategoryId"
            hint="Sert à composer les rencontres B2B et à dimensionner les espaces."
            error={fieldError("targetCategoryId")}
          >
            <Select id="targetCategoryId" {...register("targetCategoryId")}>
              <option value="">Non précisé</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Message au Commissariat Général" htmlFor="message" error={fieldError("message")}>
            <Textarea id="message" placeholder="Besoin particulier, accompagnants, contraintes d'accès…" {...register("message")} />
          </Field>
        </fieldset>

        <Checkbox {...register("consent")} error={fieldError("consent")}>
          J&apos;accepte que mes données soient utilisées pour le traitement de mon inscription et
          la production de mon badge, conformément à la{" "}
          <a href="/confidentialite" className="font-medium text-primary underline">
            politique de confidentialité
          </a>
          .
        </Checkbox>

        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {isSubmitting ? "Envoi en cours…" : "Envoyer ma demande"}
          </Button>
          <p className="text-caption text-light-muted dark:text-dark-muted">
            Les champs marqués d&apos;un <span className="text-danger">*</span> sont obligatoires.
          </p>
        </div>
      </form>
    </div>
  );
}
