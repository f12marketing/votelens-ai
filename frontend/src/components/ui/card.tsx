import { cn } from "../../lib/utils/cn";

export interface CardProps {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "interactive" | "insight" | "stat";
  onClick?: () => void;
}

export function Card({ className, children, variant = "default", onClick }: CardProps) {
  const baseClasses = "rounded-lg bg-background-elevated border border-border-subtle";
  
  const variantClasses = {
    default: "p-6 shadow-sm",
    interactive: "p-6 shadow-sm cursor-pointer transition-all duration-fast hover:shadow-md hover:border-primary",
    insight: "p-6 shadow-md rounded-xl",
    stat: "p-5 shadow-sm",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

export interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function CardTitle({ className, children }: CardTitleProps) {
  return (
    <h3 className={cn("text-h3 font-semibold text-text-primary", className)}>
      {children}
    </h3>
  );
}

export interface CardSubtitleProps {
  className?: string;
  children: React.ReactNode;
}

export function CardSubtitle({ className, children }: CardSubtitleProps) {
  return (
    <p className={cn("text-sm text-text-secondary mt-1", className)}>
      {children}
    </p>
  );
}

export interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

export function CardBody({ className, children }: CardBodyProps) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
}

export interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function CardFooter({ className, children }: CardFooterProps) {
  return (
    <div className={cn("mt-4 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}
