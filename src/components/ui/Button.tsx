import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "ghost" | "outline" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "primary-gradient text-white shadow-sm hover:-translate-y-px hover:shadow-md active:scale-[.97]",
  ghost:
    "text-[var(--muted)] hover:bg-[rgba(127,127,127,0.14)] active:scale-[.97]",
  outline:
    "border border-[var(--border)] text-[var(--text)] hover:border-indigo-400 hover:text-indigo-600 active:scale-[.97]",
  danger: "bg-red-500 text-white hover:bg-red-600 active:scale-[.97]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}

/** Single button component — every action in the app uses this. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition duration-150 disabled:opacity-50 disabled:pointer-events-none ${
        size === "sm"
          ? "text-[12.5px] px-3 py-1.5 min-h-[36px]"
          : "text-[13.5px] px-4 py-2.5 min-h-[44px]"
      } ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
});
