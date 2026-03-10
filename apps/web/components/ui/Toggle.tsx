"use client";

import React from "react";

interface ToggleProps {
  label?: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({
  label,
  description,
  checked = false,
  onChange,
  disabled = false,
}: ToggleProps) {
  const handleChange = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label className="text-sm font-bold text-neutral-900 dark:text-[#c0caf5]">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-neutral-500 dark:text-[#565f89]">
              {description}
            </p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={handleChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
          checked 
            ? "bg-violet-600 dark:bg-violet-500 shadow-sm shadow-violet-500/20" 
            : "bg-neutral-200 dark:bg-[#292e42]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
            checked ? "translate-x-5.5 shadow-sm" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
