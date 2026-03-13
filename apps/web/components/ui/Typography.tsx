import React from "react";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const Heading = ({ children, className = "", as: Tag = "h1", ...props }: TypographyProps & { as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" }) => {
  const sizes = {
    h1: "text-4xl font-extrabold tracking-tight",
    h2: "text-3xl font-bold tracking-tight",
    h3: "text-2xl font-bold tracking-tight",
    h4: "text-xl font-bold",
    h5: "text-lg font-bold",
    h6: "text-base font-bold",
  };

  return (
    <Tag className={`${sizes[Tag as keyof typeof sizes]} text-neutral-900 dark:text-admin-text ${className}`} {...props}>
      {children}
    </Tag>
  );
};

export const Text = ({ children, className = "", as: Tag = "p", ...props }: TypographyProps) => {
  return (
    <Tag className={`leading-relaxed text-neutral-600 dark:text-admin-text-muted ${className}`} {...props}>
      {children}
    </Tag>
  );
};
