import React from "react";

export function MadeArtLogo({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-sm font-bold tracking-tight text-white ${className || ""}`}
    >
      M
    </span>
  );
}

export function MadeArtLogoWithText({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className || ""}`}>
      <MadeArtLogo />
      <span className="text-lg font-bold tracking-tight text-text-primary">
        MadeArt<span className="ml-1 text-xs font-medium text-primary-500">AI</span>
      </span>
    </span>
  );
}

export function MadeArtLogoWithTextDark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className || ""}`}>
      <MadeArtLogo />
      <span className="text-lg font-bold tracking-tight text-white">
        MadeArt<span className="ml-1 text-xs font-medium text-primary-400">AI</span>
      </span>
    </span>
  );
}
