import { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Subtle lift on hover — only for cards that are actually clickable. */
  interactive?: boolean;
}

/** The single surface container. Max one nesting level anywhere in the app. */
export function Card({ interactive = false, className = "", ...props }: CardProps) {
  return (
    <div
      className={`card ${interactive ? "hover:-translate-y-0.5 hover:shadow-md transition" : ""} ${className}`}
      {...props}
    />
  );
}
