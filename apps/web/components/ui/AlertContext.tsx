"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, Info, HelpCircle, X } from "lucide-react";
import Button from "./Button";
import { Heading, Text } from "./Typography";

type AlertType = "success" | "error" | "info" | "question";

interface AlertOptions {
  title: string;
  message?: string;
  icon?: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => Promise<boolean>;
  success: (title: string, message?: string) => Promise<boolean>;
  error: (title: string, message?: string) => Promise<boolean>;
  info: (title: string, message?: string) => Promise<boolean>;
  confirm: (title: string, message?: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const showAlert = useCallback((options: AlertOptions): Promise<boolean> => {
    setAlert(options);
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    setAlert(null);
    if (resolvePromise) {
      resolvePromise(result);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const success = (title: string, message?: string) => 
    showAlert({ title, message, icon: "success", confirmText: "ตกลง" });

  const error = (title: string, message?: string) => 
    showAlert({ title, message, icon: "error", confirmText: "ตกลง" });

  const info = (title: string, message?: string) => 
    showAlert({ title, message, icon: "info", confirmText: "ตกลง" });

  const confirm = (title: string, message?: string) => 
    showAlert({ 
      title, 
      message, 
      icon: "question", 
      showCancel: true, 
      confirmText: "ยืนยัน", 
      cancelText: "ยกเลิก" 
    });

  return (
    <AlertContext.Provider value={{ showAlert, success, error, info, confirm }}>
      {children}
      {alert && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !alert.showCancel && handleClose(false)}
          />
          
          {/* Alert Box */}
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1a1b26] rounded-4xl shadow-2xl border border-neutral-100 dark:border-[#292e42] p-8 animate-in zoom-in-95 fade-in duration-200">
            <div className="flex flex-col items-center text-center">
              {/* Icon Section */}
              <div className="mb-6 relative">
                 {alert.icon === "success" && (
                    <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-in zoom-in spin-in-12 duration-500">
                        <CheckCircle2 size={44} strokeWidth={2.5} />
                    </div>
                 )}
                 {alert.icon === "error" && (
                    <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 animate-in zoom-in bounce-in duration-500">
                        <X size={44} strokeWidth={2.5} />
                    </div>
                 )}
                 {alert.icon === "info" && (
                    <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 animate-in zoom-in duration-500">
                        <Info size={44} strokeWidth={2.5} />
                    </div>
                 )}
                 {alert.icon === "question" && (
                    <div className="w-20 h-20 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-500 animate-in zoom-in duration-500">
                        <HelpCircle size={44} strokeWidth={2.5} />
                    </div>
                 )}
              </div>

              {/* Text Section */}
              <Heading as="h4" className="mb-2 text-neutral-900 dark:text-[#c0caf5]">
                {alert.title}
              </Heading>
              {alert.message && (
                <Text className="text-neutral-500 dark:text-[#a9b1d6] leading-relaxed">
                  {alert.message}
                </Text>
              )}

              {/* Actions Section */}
              <div className="mt-10 flex flex-col w-full gap-3">
                <Button 
                    className="w-full py-4 rounded-2xl shadow-lg shadow-violet-500/10"
                    onClick={() => handleClose(true)}
                >
                    {alert.confirmText || "ตกลง"}
                </Button>
                {alert.showCancel && (
                    <Button 
                        variant="ghost" 
                        className="w-full text-neutral-400 dark:text-[#565f89] hover:text-neutral-600"
                        onClick={() => handleClose(false)}
                    >
                        {alert.cancelText || "ยกเลิก"}
                    </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}
