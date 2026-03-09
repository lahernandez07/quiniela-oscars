"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isAdmin } from "@/lib/admin";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [status, setStatus] = useState<"checking" | "authorized" | "blocked">(
    "checking"
  );

  useEffect(() => {
    let mounted = true;

    async function validateAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      const email = user?.email ?? null;

      if (!user) {
        setStatus("blocked");
        router.replace("/login");
        return;
      }

      if (!isAdmin(email)) {
        setStatus("blocked");
        router.replace("/");
        return;
      }

      setStatus("authorized");
    }

    validateAccess();
  }, [router, supabase]);

  if (status === "checking") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg">Verificando acceso admin...</p>
      </main>
    );
  }

  if (status !== "authorized") {
    return null;
  }

  return <>{children}</>;
}