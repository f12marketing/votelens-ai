import { UserRole } from "../../types/auth";

export interface RouteConfig {
  path: string;
  component: () => Promise<{ default: React.ComponentType }>;
  roles?: UserRole[];
  isPublic?: boolean;
  title: string;
}

export const routes: RouteConfig[] = [
  {
    path: "/",
    component: () => import("../../pages/landing"),
    isPublic: true,
    title: "VoteLens AI",
  },
  {
    path: "/login",
    component: () => import("../../pages/auth/login"),
    isPublic: true,
    title: "Login - VoteLens AI",
  },
  {
    path: "/register",
    component: () => import("../../pages/auth/register"),
    isPublic: true,
    title: "Register - VoteLens AI",
  },
  {
    path: "/dashboard",
    component: () => import("../../pages/dashboard"),
    roles: ["user", "analyst", "admin"],
    title: "Dashboard - VoteLens AI",
  },
  {
    path: "/upload",
    component: () => import("../../pages/upload"),
    roles: ["user", "analyst", "admin"],
    title: "Upload - VoteLens AI",
  },
  {
    path: "/constituencies",
    component: () => import("../../pages/constituencies"),
    roles: ["user", "analyst", "admin"],
    title: "Constituencies - VoteLens AI",
  },
  {
    path: "/insights",
    component: () => import("../../pages/insights"),
    roles: ["user", "analyst", "admin"],
    title: "Insights - VoteLens AI",
  },
  {
    path: "/ask-ai",
    component: () => import("../../pages/ask-ai"),
    roles: ["user", "analyst", "admin"],
    title: "Ask AI - VoteLens AI",
  },
  {
    path: "/reports",
    component: () => import("../../pages/reports"),
    roles: ["user", "analyst", "admin"],
    title: "Reports - VoteLens AI",
  },
  {
    path: "/advanced-analytics",
    component: () => import("../../pages/advanced-analytics"),
    roles: ["analyst", "admin"],
    title: "Advanced Analytics - VoteLens AI",
  },
  {
    path: "/admin",
    component: () => import("../../pages/admin"),
    roles: ["admin"],
    title: "Admin - VoteLens AI",
  },
];

export const getRouteByPath = (path: string): RouteConfig | undefined => {
  return routes.find((route) => route.path === path);
};

export const hasAccess = (route: RouteConfig, userRole?: UserRole): boolean => {
  if (route.isPublic) return true;
  if (!userRole) return false;
  if (!route.roles) return true;
  return route.roles.includes(userRole);
};
