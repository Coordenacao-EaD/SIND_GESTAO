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
  // Browsers strip tabs/newlines and treat backslashes as forward slashes when
  // resolving an href (WHATWG URL spec), so "/\evil.com" or "/\t/evil.com"
  // resolve to the external host "evil.com" despite starting with a single "/".
  // Normalize the same way before checking, or such disguised hosts would be
  // misclassified as internal routes and rendered without external-link safeguards.
  const normalized = href.replace(/[\t\r\n]/g, "").replace(/\\/g, "/");
  return normalized.startsWith("/") && !normalized.startsWith("//");
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
