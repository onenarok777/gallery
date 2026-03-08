"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center bg-background/80 backdrop-blur-md rounded-full shadow-lg border border-neutral-200 dark:border-neutral-800 p-1">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-full transition-colors ${
          theme === "light" 
            ? "bg-white text-black shadow-sm" 
            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
        }`}
        aria-label="Light Mode"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-full transition-colors ${
          theme === "system" 
            ? "bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white shadow-sm" 
            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
        }`}
        aria-label="System Mode"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-full transition-colors ${
          theme === "dark" 
            ? "bg-neutral-800 text-white shadow-sm" 
            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
        }`}
        aria-label="Dark Mode"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    </div>
  );
}
