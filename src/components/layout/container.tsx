import type { ComponentPropsWithoutRef } from "react";

type ContainerProps = ComponentPropsWithoutRef<"div">;

/**
 * Shared horizontal rhythm for public pages. Keeping width and gutters here
 * prevents route implementations from drifting as the site grows.
 */
export function Container({ className = "", ...props }: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-7xl px-[var(--space-page)] ${className}`}
      {...props}
    />
  );
}
