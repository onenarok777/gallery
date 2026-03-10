"use client";

import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = "", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-semibold text-neutral-800 dark:text-[#c0caf5]">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-violet-500 transition-colors">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 bg-white dark:bg-[#1a1b26] 
              border border-neutral-200 dark:border-[#292e42] 
              rounded-lg text-neutral-900 dark:text-[#c0caf5] 
              placeholder:text-neutral-400 dark:placeholder:text-[#565f89]
              focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
              disabled:opacity-50 disabled:bg-neutral-50 dark:disabled:bg-[#1f2335]
              transition-all duration-200
              ${leftIcon ? "pl-11" : ""}
              ${rightIcon ? "pr-11" : ""}
              ${error ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : ""}
              ${className}
            `}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error ? (
          <p className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-neutral-500 dark:text-[#a9b1d6]">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
