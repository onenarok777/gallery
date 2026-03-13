"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import Image from "next/image";

interface UserProfile {
  email: string;
  name?: string;
  picture?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AdminNavbar() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const cookies = document.cookie.split("; ");
        const tokenCookie = cookies.find((row) => row.startsWith("admin_token="));
        if (!tokenCookie) {
          setLoading(false);
          return;
        }

        const token = tokenCookie.split("=")[1];
        
        const res = await fetch(`${API_BASE}/api/auth/verify`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.valid && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between md:justify-end px-4 md:px-6 bg-white/80 dark:bg-admin-surface/80 backdrop-blur-md border-b border-neutral-200 dark:border-admin-border">
      {/* Mobile Title */}
      <div className="md:hidden flex items-center">
        <span className="font-bold text-lg text-neutral-900 dark:text-white">
          Gallery Admin
        </span>
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {loading ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-admin-border"></div>
            <div className="hidden sm:flex flex-col gap-1">
              <div className="w-20 h-3 bg-neutral-200 dark:bg-admin-border rounded"></div>
              <div className="w-32 h-3 bg-neutral-200 dark:bg-admin-border rounded"></div>
            </div>
          </div>
        ) : user ? (
          <>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-neutral-900 dark:text-white leading-tight">
                {user.name || "Administrator"}
              </span>
              <span className="text-xs text-neutral-500 dark:text-admin-text-muted">
                {user.email}
              </span>
            </div>
            {user.picture ? (
              <Image
                src={user.picture}
                alt={user.name || "User"}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-admin-border shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center border border-violet-200 dark:border-violet-800 shadow-sm">
                <User className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-neutral-500 dark:text-admin-text-muted">
            Not logged in
          </div>
        )}
      </div>
    </header>
  );
}
