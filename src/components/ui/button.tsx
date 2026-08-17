import Link, { type LinkProps } from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const baseStyles =
  "inline-flex min-h-12 items-center justify-center rounded-[var(--radius-pill)] px-6 py-3 text-[0.6875rem] font-bold tracking-[0.16em] uppercase transition-[color,background-color,border-color,transform,box-shadow] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 disabled:pointer-events-none disabled:opacity-50 sm:px-7";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-palem-green bg-palem-green text-brand-white shadow-[0_10px_28px_rgb(2_108_32_/_0.18)] hover:-translate-y-0.5 hover:border-dark-green hover:bg-dark-green hover:shadow-[0_14px_34px_rgb(1_58_20_/_0.2)] focus-visible:outline-gold",
  secondary:
    "border border-dark-green/25 bg-transparent text-dark-green hover:-translate-y-0.5 hover:border-dark-green hover:bg-dark-green hover:text-brand-white focus-visible:outline-palem-green",
  ghost:
    "border border-transparent bg-transparent text-current hover:bg-current/10 focus-visible:outline-gold",
};

type ButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    variant?: ButtonVariant;
  };

export function ButtonLink({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}
