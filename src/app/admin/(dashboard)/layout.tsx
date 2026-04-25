import { AdminSidebar } from "@/components/admin/sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">
        <main className="mx-auto w-full max-w-6xl p-8">{children}</main>
      </div>
    </div>
  );
}
