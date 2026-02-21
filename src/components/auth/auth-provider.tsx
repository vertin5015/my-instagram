"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, user } = useAuthStore();
  const [mounted] = useState(true);

  useEffect(() => {
    if (!user) {
      fetchUser();
    }
  }, [fetchUser, user]);

  return <>{children}</>;
}
