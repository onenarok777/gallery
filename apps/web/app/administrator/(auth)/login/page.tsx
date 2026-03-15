"use client";

import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, AlertCircle } from "lucide-react";


const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError("ไม่สามารถรับข้อมูลจาก Google ได้");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "เข้าสู่ระบบไม่สำเร็จ");
        setIsLoading(false);
        return;
      }

      // Set cookie with token (7 days)
      document.cookie = `admin_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      router.push("/administrator");
    } catch (err) {
      console.error("Login error:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setIsLoading(false);
    }
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#0a0a0f] text-neutral-900 dark:text-white">
        <div className="bg-white dark:bg-white/5 border border-red-500/20 p-8 rounded-2xl max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">ยังไม่ได้ตั้งค่า Google Login</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            กรุณาตั้งค่า <code className="bg-neutral-100 dark:bg-black p-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> ในไฟล์ .env ของคุณ
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-50 dark:bg-admin-surface text-neutral-900 dark:text-admin-text">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-admin-surface/80 backdrop-blur-xl border border-admin-border rounded-2xl p-8 sm:p-10 shadow-2xl shadow-violet-500/5">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-5 shadow-lg shadow-violet-500/25">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                เข้าสู่ระบบผู้ดูแล
              </h1>
              <p className="text-sm text-neutral-500 dark:text-admin-text-muted/70">
                กรุณาเข้าสู่ระบบด้วยบัญชี Google ที่ได้รับอนุญาต
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Google Login Button */}
            <div className="flex justify-center">
              {isLoading ? (
                <div className="flex items-center gap-3 py-3">
                  <svg
                    className="animate-spin h-5 w-5 text-violet-500 dark:text-violet-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-sm text-admin-text-muted">
                    กำลังเข้าสู่ระบบ...
                  </span>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("เข้าสู่ระบบด้วย Google ไม่สำเร็จ")}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  width="320"
                  text="signin_with"
                />
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-admin-border">
              <p className="text-center text-xs text-admin-text-dim">
                เฉพาะบัญชีที่ได้รับอนุญาตเท่านั้นที่สามารถเข้าใช้งานได้
              </p>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
