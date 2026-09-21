import {
  BarChart3Icon,
  FolderTreeIcon,
  LayoutDashboardIcon,
  ImageIcon,
  MailIcon,
  MegaphoneIcon,
  NewspaperIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  TagsIcon,
  TicketPercentIcon,
  UserCogIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Exact match only (e.g. dashboard root). */
  exact?: boolean;
  /** Only show for superadmin. */
  superadminOnly?: boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: PackageIcon,
  },
  {
    href: "/admin/banners",
    label: "Banners",
    icon: MegaphoneIcon,
  },
  {
    href: "/admin/coupons",
    label: "Coupons",
    icon: TicketPercentIcon,
  },
  {
    href: "/admin/leads",
    label: "Leads",
    icon: MailIcon,
  },
  {
    href: "/admin/blog",
    label: "Blog",
    icon: NewspaperIcon,
  },
  {
    href: "/admin/blog/tags",
    label: "Blog tags",
    icon: TagsIcon,
  },
  {
    href: "/admin/media",
    label: "Media",
    icon: ImageIcon,
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: FolderTreeIcon,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingBagIcon,
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: UsersIcon,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3Icon,
  },
  {
    href: "/admin/team",
    label: "Team",
    icon: UserCogIcon,
    superadminOnly: true,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: SettingsIcon,
  },
];

export function isAdminNavActive(pathname: string, item: AdminNavItem) {
  if (item.exact) {
    return pathname === item.href;
  }
  const matches =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  if (!matches) {
    return false;
  }
  // Prefer a more specific nav item when paths nest (e.g. /admin/blog/tags).
  const hasMoreSpecificMatch = ADMIN_NAV_ITEMS.some(
    (other) =>
      other.href !== item.href &&
      other.href.length > item.href.length &&
      (pathname === other.href || pathname.startsWith(`${other.href}/`)),
  );
  return !hasMoreSpecificMatch;
}

export function adminTitleFromPath(pathname: string): string {
  if (pathname === "/admin") {
    return "Dashboard";
  }

  const match = [...ADMIN_NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isAdminNavActive(pathname, item));
  if (match) {
    return match.label;
  }

  const segment = pathname.split("/").filter(Boolean).pop();
  return segment ? segment.replace(/-/g, " ") : "Admin";
}
