"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ButtonLink } from "@/components/ui/button";

import { Container } from "./container";

const navigation = [
  { label: "Menu", href: "/menu" },
  { label: "Promo", href: "/promo" },
  { label: "Event", href: "/event" },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
] as const;

type NavbarProps = {
  mode?: "overlay" | "solid";
};

export function Navbar({ mode = "solid" }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  const hasSolidSurface = mode === "solid" || isScrolled || isMenuOpen;

  useEffect(() => {
    if (mode === "solid") return;

    const updateNavbar = () => setIsScrolled(window.scrollY > 24);
    updateNavbar();
    window.addEventListener("scroll", updateNavbar, { passive: true });

    return () => window.removeEventListener("scroll", updateNavbar);
  }, [mode]);

  useEffect(() => {
    if (!isMenuOpen) return;

    firstMobileLinkRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      data-surface={hasSolidSurface ? "solid" : "overlay"}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ease-out ${
        hasSolidSurface
          ? "border-dark-green/10 bg-cream/95 text-dark-green shadow-[var(--shadow-nav)] backdrop-blur-xl"
          : "border-brand-white/15 bg-transparent text-brand-white"
      }`}
    >
      <Container>
        <nav
          aria-label="Main navigation"
          className="flex h-20 items-center justify-between lg:h-24"
        >
          <Link
            href="/"
            aria-label="Dapoer Palem home"
            className="relative z-10 -ml-2 flex h-18 w-18 items-center justify-center rounded-md focus-visible:outline-gold lg:h-22 lg:w-22"
            onClick={closeMenu}
          >
            <Image
              src={
                hasSolidSurface
                  ? "/logo/dapoer-palem-black.png"
                  : "/logo/dapoer-palem-white.png"
              }
              alt="Dapoer Palem — Inspired by Nature"
              width={1600}
              height={1600}
              priority
              className="h-full w-full object-contain transition-opacity duration-300"
              sizes="88px"
            />
          </Link>

          <div className="hidden items-center gap-7 lg:flex xl:gap-9">
            <ul className="flex items-center gap-6 xl:gap-8">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative py-3 text-[0.6875rem] font-bold tracking-[0.14em] uppercase after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-right after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink
              href="/reservation"
              className={
                hasSolidSurface
                  ? "min-h-11 px-5"
                  : "min-h-11 !border-brand-white !bg-brand-white px-5 !text-dark-green shadow-none hover:!border-cream hover:!bg-cream"
              }
            >
              Reservation
            </ButtonLink>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-current/20 transition-colors hover:bg-current/10 focus-visible:outline-gold lg:hidden"
          >
            <span className="sr-only">
              {isMenuOpen ? "Close menu" : "Open menu"}
            </span>
            <span aria-hidden="true" className="relative block h-4 w-5">
              <span
                className={`absolute left-0 top-0 h-px w-5 bg-current transition-transform duration-300 ${isMenuOpen ? "translate-y-[7.5px] rotate-45" : ""}`}
              />
              <span
                className={`absolute left-0 top-[7.5px] h-px w-5 bg-current transition-opacity duration-200 ${isMenuOpen ? "opacity-0" : "opacity-100"}`}
              />
              <span
                className={`absolute bottom-0 left-0 h-px w-5 bg-current transition-transform duration-300 ${isMenuOpen ? "-translate-y-[7.5px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </nav>

        <div
          id="mobile-navigation"
          aria-hidden={!isMenuOpen}
          inert={!isMenuOpen}
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out lg:hidden ${
            isMenuOpen
              ? "grid-rows-[1fr] opacity-100"
              : "pointer-events-none grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <ul className="border-t border-dark-green/10 py-4">
              {navigation.map((item, index) => (
                <li key={item.href}>
                  <Link
                    ref={index === 0 ? firstMobileLinkRef : undefined}
                    href={item.href}
                    onClick={closeMenu}
                    className="flex min-h-12 items-center border-b border-dark-green/8 text-sm font-bold tracking-[0.12em] uppercase transition-colors hover:text-palem-green"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink
              href="/reservation"
              onClick={closeMenu}
              className="mb-6 w-full"
            >
              Reservation
            </ButtonLink>
          </div>
        </div>
      </Container>
    </header>
  );
}
