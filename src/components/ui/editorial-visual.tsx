import type { ComponentPropsWithoutRef, ReactNode } from "react";

type EditorialVisualProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  children?: ReactNode;
  label: string;
  tone?: "cream" | "green";
};

/**
 * Image-ready surface used until approved photography is supplied. The stable
 * data attribute gives a future CMS/image integration a clear replacement hook.
 */
export function EditorialVisual({
  children,
  className = "",
  label,
  tone = "green",
  ...props
}: EditorialVisualProps) {
  const tones =
    tone === "green"
      ? "border-brand-white/15 bg-dark-green text-brand-white"
      : "border-dark-green/12 bg-cream text-dark-green";

  return (
    <div
      data-image-slot={label.toLowerCase().replaceAll(" ", "-")}
      role="img"
      aria-label={`${label} image placeholder`}
      className={`relative isolate overflow-hidden border ${tones} ${className}`}
      {...props}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_78%,rgb(212_175_55_/_0.18),transparent_28%),linear-gradient(135deg,transparent_35%,rgb(255_255_255_/_0.04)_35%,rgb(255_255_255_/_0.04)_36%,transparent_36%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-[18%] -top-[18%] -z-10 aspect-square w-[78%] rounded-full border border-current/12"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-[28%] -left-[18%] -z-10 aspect-square w-[64%] rounded-full border border-gold/30"
      />
      {children}
    </div>
  );
}
