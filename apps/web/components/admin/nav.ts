import {
  Award,
  CalendarRange,
  FileText,
  FolderOpen,
  Image,
  LayoutDashboard,
  MailOpen,
  Megaphone,
  Network,
  ShieldCheck,
  Store,
  UserRoundCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { MODULE_LABELS, type AdminModule } from "@fihadj/shared-types";

/**
 * Chaque module de la matrice RBAC a exactement une entrée de menu.
 * Le menu est ensuite filtré par `modulesFor(role)` : ce que le rôle ne voit pas
 * ici, l'API le refuse aussi — les deux lisent la même matrice.
 */
export const NAV: Record<AdminModule, { href: string; Icon: LucideIcon }> = {
  stats: { href: "/admin", Icon: LayoutDashboard },
  inscriptions: { href: "/admin/inscriptions", Icon: UserRoundCheck },
  exposants: { href: "/admin/exposants", Icon: Store },
  sponsors: { href: "/admin/sponsors", Icon: Award },
  programme: { href: "/admin/programme", Icon: CalendarRange },
  contenu: { href: "/admin/contenu", Icon: FileText },
  actualites: { href: "/admin/actualites", Icon: Megaphone },
  medias: { href: "/admin/medias", Icon: Image },
  organigramme: { href: "/admin/organigramme", Icon: Network },
  budget: { href: "/admin/budget", Icon: Wallet },
  messages: { href: "/admin/messages", Icon: MailOpen },
  rapports: { href: "/admin/rapports", Icon: FolderOpen },
  editions: { href: "/admin/editions", Icon: CalendarRange },
  utilisateurs: { href: "/admin/utilisateurs", Icon: ShieldCheck },
};

export const navLabel = (module: AdminModule): string => MODULE_LABELS[module];
