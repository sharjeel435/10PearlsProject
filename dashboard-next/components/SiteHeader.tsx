"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/dashboard", label: "Forecast" },
    { href: "/models", label: "Models" },
    { href: "/methodology", label: "Methodology" },
    { href: "/about", label: "About" },
  ];


  return (
    <header className={`site-navbar${scrolled ? " scrolled" : ""}`}>
      <Link className="brand-container" href="/">
        <div className="brand-logotype">
          <span className="brand-name">Pearls</span>
          <span className="brand-tagline">Air Intelligence</span>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <nav className="nav-links" aria-label="Main navigation">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link-item${isActive ? " active" : ""}`}
            >
              {link.label}
              {isActive && (
                <motion.div
                  layoutId="nav-active-indicator"
                  className="nav-active-indicator"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile toggle */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute",
              top: "60px",
              left: 0,
              right: 0,
              background: "rgba(6, 12, 15, 0.98)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid var(--border-faint)",
              padding: "20px 4vw",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              zIndex: 100,
            }}
          >
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "14px",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                    background: isActive ? "var(--bg-surface-2)" : "transparent",
                    letterSpacing: "-0.01em",
                    display: "block",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}