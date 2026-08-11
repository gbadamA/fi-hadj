"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@fihadj/shared-types";
import { useAuth } from "@/lib/auth";
import type { ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/primitives";
import { Field, FormAlert, Input } from "@/components/ui/form";

export default function AdminLoginPage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  // Session déjà valide (cookie de rafraîchissement encore bon) : inutile de
  // redemander les identifiants.
  useEffect(() => {
    if (!loading && user) router.replace("/admin");
  }, [loading, user, router]);

  async function onSubmit(values: LoginInput) {
    setGlobalError(null);
    try {
      await signIn(values.email, values.password);
      router.replace("/admin");
    } catch (error) {
      const apiError = error as ApiClientError;
      setGlobalError(
        apiError.status === 429
          ? "Trop de tentatives. Patientez une minute avant de réessayer."
          : apiError.message,
      );
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Colonne de gauche : la signature visuelle du forum, pour que la page de
          connexion ne ressemble pas à un formulaire générique. */}
      <section className="relative hidden overflow-hidden bg-diplomatic lg:block">
        <div className="pattern-islamic absolute inset-0" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-12">
          <span className="font-display text-2xl font-bold text-white">FI-HADJ</span>
          <div>
            <p className="flex items-center gap-3 text-caption font-semibold uppercase tracking-[0.2em] text-secondary">
              <span className="h-px w-10 bg-secondary" aria-hidden />
              Commissariat Général
            </p>
            <p className="mt-5 max-w-md font-display text-[2rem] font-bold leading-tight text-white">
              Le système de gestion du Forum International du Hadj
            </p>
            <p className="mt-4 max-w-md text-body text-white/75">
              Contenu du site, inscriptions, exposants, sponsors, budget et statistiques — chaque
              responsable accède aux modules qui relèvent de sa commission.
            </p>
          </div>
          <p className="text-caption text-white/50">SESAP &amp; CDIDES · Abidjan</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-caption text-light-muted transition hover:text-primary dark:text-dark-muted"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour au site
          </Link>

          <h1 className="font-display text-h1">Connexion</h1>
          <p className="mt-2 text-body text-light-muted dark:text-dark-muted">
            Espace réservé aux membres du Commissariat Général.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            {globalError && <FormAlert tone="error" title={globalError} />}

            <Field label="Adresse email" htmlFor="email" required error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                invalid={Boolean(errors.email)}
                {...register("email")}
              />
            </Field>

            <Field label="Mot de passe" htmlFor="password" required error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                invalid={Boolean(errors.password)}
                {...register("password")}
              />
            </Field>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {isSubmitting ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

          <p className="mt-8 text-caption text-light-muted dark:text-dark-muted">
            Mot de passe oublié ? Adressez-vous au Responsable Informatique ou au Responsable
            Ressources Humaines, seuls habilités à réinitialiser un accès.
          </p>
        </div>
      </section>
    </div>
  );
}
