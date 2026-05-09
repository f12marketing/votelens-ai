import { cn } from "../../lib/utils/cn";
import { TrendingUp, AlertTriangle, Sparkles, Brain } from "lucide-react";

export interface InsightCardProps {
  className?: string;
  type: "trend" | "anomaly" | "prediction" | "demographic";
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
  onClick?: () => void;
}

const icons = {
  trend: TrendingUp,
  anomaly: AlertTriangle,
  prediction: Sparkles,
  demographic: Brain,
};

const badgeColors = {
  trend: "bg-success-subtle text-success",
  anomaly: "bg-warning-subtle text-warning",
  prediction: "bg-ai-accent-subtle text-ai-accent",
  demographic: "bg-primary-subtle text-primary",
};

const badgeLabels = {
  trend: "Trend",
  anomaly: "Anomaly",
  prediction: "Prediction",
  demographic: "Demographic",
};

const iconColors = {
  trend: "text-success",
  anomaly: "text-warning",
  prediction: "text-ai-accent",
  demographic: "text-primary",
};

export function InsightCard({
  className,
  type,
  title,
  description,
  confidence,
  timestamp,
  onClick,
}: InsightCardProps) {
  const Icon = icons[type];

  return (
    <div
      className={cn(
        "rounded-xl bg-background-elevated border border-border-subtle p-6 shadow-md transition-all duration-fast hover:shadow-lg",
        onClick && "cursor-pointer hover:border-primary",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center bg-background-tertiary", iconColors[type])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-h3 font-semibold text-text-primary">{title}</h3>
            <span className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1",
              badgeColors[type]
            )}>
              {badgeLabels[type]}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-4 leading-relaxed">
        {description}
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted font-medium">Confidence</span>
          <span className="text-xs text-text-primary font-semibold">{confidence}%</span>
        </div>
        <div className="h-1 bg-background-tertiary rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300 rounded-full", iconColors[type])}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-text-muted">{timestamp}</span>
        </div>
      </div>
    </div>
  );
}
