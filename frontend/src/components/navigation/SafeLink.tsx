import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface SafeLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}

function isInternalPath(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

function isSafeExternalUrl(href: string): boolean {
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}

export function SafeLink({
  href,
  className,
  children,
  disabled = false,
  ariaLabel,
}: SafeLinkProps) {
  if (disabled || (!isInternalPath(href) && !isSafeExternalUrl(href))) {
    return (
      <span className={className} aria-disabled="true" aria-label={ariaLabel}>
        {children}
      </span>
    );
  }

  if (isInternalPath(href)) {
    return (
      <Link to={href} className={className} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel ? `${ariaLabel} (abre em uma nova aba)` : undefined}
    >
      {children}
      {ariaLabel ? null : <span className="visually-hidden"> (abre em uma nova aba)</span>}
    </a>
  );
}
