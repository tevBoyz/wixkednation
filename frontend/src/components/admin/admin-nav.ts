import {
  FolderTreeIcon,
  LayoutDashboardIcon,
  ImageIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Exact match only (e.g. dashboard root). */
  exact?: boolean;
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
    href: "/admin/settings",
    label: "Settings",
    icon: SettingsIcon,
  },
];

export function isAdminNavActive(pathname: string, item: AdminNavItem) {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function adminTitleFromPath(pathname: string): string {
  if (pathname === "/admin") {
    return "Dashboard";
  }

  const match = ADMIN_NAV_ITEMS.find((item) =>
    isAdminNavActive(pathname, item),
  );
  if (match) {
    return match.label;
  }

  const segment = pathname.split("/").filter(Boolean).pop();
  return segment ? segment.replace(/-/g, " ") : "Admin";
}
