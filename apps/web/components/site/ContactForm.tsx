"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { contactSchema, type ContactInput } from "@fihadj/shared-types";
import { api, type ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/primitives";
import { Checkbox, Field, FormAlert, Input, Textarea } from "@/components/ui/form";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { consent: false as never },
  });

  async function onSubmit(values: ContactInput) {
    setGlobalError(null);
    try {
      await api.post("/contact", values);
      setSent(true);
      reset();
    } catch (error) {
      const apiError = error as ApiClientError;
      setGlobalError(
        apiError.status === 429
          ? "Trop de messages envoyés depuis cette connexion. Réessayez dans une heure."
          : apiError.message,
      );
    }
  }

  if (sent) {
    return (
      <FormAlert tone="success" title="Votre message est bien parti.">
        Le Commissariat Général vous répondra dans les meilleurs délais. Un accusé de réception
        vient de vous être envoyé par email.
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
            Écrire un autre message
          </Button>
        </div>
      </FormAlert>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () =>
        setGlobalError("Certains champs sont invalides. Vérifiez les mentions en rouge."),
      )}
      className="space-y-5"
      noValidate
    >
      {globalError && <FormAlert tone="error" title={globalError} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom et prénom" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" autoComplete="name" invalid={Boolean(errors.name)} {...register("name")} />
        </Field>
        <Field label="Adresse email" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" invalid={Boolean(errors.email)} {...register("email")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Téléphone" htmlFor="phone" error={errors.phone?.message}>
          <Input id="phone" type="tel" autoComplete="tel" placeholder="+225 07 07 07 07 07" invalid={Boolean(errors.phone)} {...register("phone")} />
        </Field>
        <Field label="Sujet" htmlFor="subject" required error={errors.subject?.message}>
          <Input id="subject" invalid={Boolean(errors.subject)} {...register("subject")} />
        </Field>
      </div>

      <Field label="Message" htmlFor="message" required error={errors.message?.message}>
        <Textarea id="message" invalid={Boolean(errors.message)} {...register("message")} />
      </Field>

      <Checkbox {...register("consent")} error={errors.consent?.message}>
        J&apos;accepte que mes coordonnées soient utilisées pour répondre à ce message,
        conformément à la{" "}
        <a href="/confidentialite" className="font-medium text-primary underline">
          politique de confidentialité
        </a>
        .
      </Checkbox>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {isSubmitting ? "Envoi en cours…" : "Envoyer le message"}
      </Button>
    </form>
  );
}
