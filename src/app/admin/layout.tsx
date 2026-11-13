import React from "react";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";

export const metadata = {
  title: "FilmFeed Admin Control Center - SSS Grade",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
