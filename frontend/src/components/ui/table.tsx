import { cn } from "../../lib/utils/cn";

export interface TableProps {
  className?: string;
  children: React.ReactNode;
}

export function Table({ className, children }: TableProps) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
}

export interface TableHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function TableHeader({ className, children }: TableHeaderProps) {
  return (
    <thead className={cn("bg-background-tertiary border-b border-border-subtle", className)}>
      {children}
    </thead>
  );
}

export interface TableBodyProps {
  className?: string;
  children: React.ReactNode;
}

export function TableBody({ className, children }: TableBodyProps) {
  return (
    <tbody className={cn("", className)}>
      {children}
    </tbody>
  );
}

export interface TableRowProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function TableRow({ className, children, onClick }: TableRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-border-subtle transition-colors duration-150 hover:bg-background-secondary",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export interface TableCellProps {
  className?: string;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}

export function TableCell({ className, children, align = "left" }: TableCellProps) {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <td className={cn("px-6 py-4 text-sm text-text-secondary", alignClasses[align], className)}>
      {children}
    </td>
  );
}

export interface TableHeadProps {
  className?: string;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}

export function TableHead({ className, children, align = "left" }: TableHeadProps) {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <th className={cn(
      "px-6 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary",
      alignClasses[align],
      className
    )}>
      {children}
    </th>
  );
}

export interface StatusBadgeProps {
  className?: string;
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "default";
}

export function StatusBadge({ className, children, variant = "default" }: StatusBadgeProps) {
  const variantClasses = {
    success: "bg-success-subtle text-success",
    warning: "bg-warning-subtle text-warning",
    error: "bg-error-subtle text-error",
    default: "bg-background-tertiary text-text-secondary",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}
