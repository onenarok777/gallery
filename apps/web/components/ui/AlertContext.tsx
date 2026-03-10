"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { swal } from "@/lib/swal";

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
  const showAlert = async (options: AlertOptions): Promise<boolean> => {
    const result = await swal.fire({
      title: options.title,
      text: options.message,
      icon: options.icon,
      showCancelButton: options.showCancel,
      confirmButtonText: options.confirmText || "ตกลง",
      cancelButtonText: options.cancelText || "ยกเลิก",
    });
    return result.isConfirmed;
  };

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
    </AlertContext.Provider>
  );
}
