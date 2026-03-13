"use client";

import React from "react";

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = "",
  ...props
}: SwitchProps) {
  return (
    <label
      className={`flex items-start justify-between gap-4 cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {(label || description) && (
        <div className="flex flex-col flex-1">
          {label && (
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {label}
            </span>
          )}
          {description && (
            <span className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
              {description}
            </span>
          )}
        </div>
      )}
      
      <div className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <div
          className={`h-full w-full rounded-full transition-colors duration-200 ease-in-out ${
            checked ? "bg-violet-500" : "bg-neutral-200 dark:bg-[#292e42]"
          }`}
        />
        <span
          className={`absolute left-0.5 inline-block h-5 w-5 rounded-full bg-white shadow pointer-events-none transform transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </label>
  );
}
