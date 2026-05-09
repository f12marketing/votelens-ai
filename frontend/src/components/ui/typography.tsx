import { cn } from "../../lib/utils/cn";

export interface TypographyProps {
  className?: string;
  children: React.ReactNode;
}

export function DisplayXL({ className, children }: TypographyProps) {
  return (
    <h1 className={cn("text-display-xl font-bold leading-none text-text-primary", className)}>
      {children}
    </h1>
  );
}

export function DisplayLG({ className, children }: TypographyProps) {
  return (
    <h1 className={cn("text-display-lg font-bold leading-none text-text-primary", className)}>
      {children}
    </h1>
  );
}

export function DisplayMD({ className, children }: TypographyProps) {
  return (
    <h1 className={cn("text-display-md font-bold leading-tight text-text-primary", className)}>
      {children}
    </h1>
  );
}

export function DisplaySM({ className, children }: TypographyProps) {
  return (
    <h1 className={cn("text-display-sm font-bold leading-tight text-text-primary", className)}>
      {children}
    </h1>
  );
}

export function H1({ className, children }: TypographyProps) {
  return (
    <h1 className={cn("text-h1 font-bold leading-snug text-text-primary", className)}>
      {children}
    </h1>
  );
}

export function H2({ className, children }: TypographyProps) {
  return (
    <h2 className={cn("text-h2 font-semibold leading-normal text-text-primary", className)}>
      {children}
    </h2>
  );
}

export function H3({ className, children }: TypographyProps) {
  return (
    <h3 className={cn("text-h3 font-semibold leading-normal text-text-primary", className)}>
      {children}
    </h3>
  );
}

export function H4({ className, children }: TypographyProps) {
  return (
    <h4 className={cn("text-h4 font-semibold leading-normal text-text-primary", className)}>
      {children}
    </h4>
  );
}

export function BodyLG({ className, children }: TypographyProps) {
  return (
    <p className={cn("text-lg leading-relaxed text-text-secondary", className)}>
      {children}
    </p>
  );
}

export function Body({ className, children }: TypographyProps) {
  return (
    <p className={cn("text-base leading-relaxed text-text-secondary", className)}>
      {children}
    </p>
  );
}

export function BodySM({ className, children }: TypographyProps) {
  return (
    <p className={cn("text-sm leading-relaxed text-text-secondary", className)}>
      {children}
    </p>
  );
}

export function Label({ className, children }: TypographyProps) {
  return (
    <label className={cn("text-xs font-medium uppercase tracking-wider text-text-muted", className)}>
      {children}
    </label>
  );
}

export function Caption({ className, children }: TypographyProps) {
  return (
    <span className={cn("text-xs text-text-muted", className)}>
      {children}
    </span>
  );
}

export function Mono({ className, children }: TypographyProps) {
  return (
    <code className={cn("font-mono text-sm text-text-secondary", className)}>
      {children}
    </code>
  );
}
