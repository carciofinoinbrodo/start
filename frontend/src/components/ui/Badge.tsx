import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';
type TrendDirection = 'up' | 'down' | 'stable';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

interface TrendBadgeProps {
  trend: TrendDirection;
}

interface SentimentBadgeProps {
  sentiment: 'positive' | 'neutral' | 'negative';
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  neutral: 'badge-neutral',
  primary: 'badge-primary',
};

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}

export function TrendBadge({ trend }: TrendBadgeProps) {
  const config = {
    up: { icon: TrendingUp, label: 'Growing', variant: 'success' as BadgeVariant },
    down: { icon: TrendingDown, label: 'Declining', variant: 'danger' as BadgeVariant },
    stable: { icon: Minus, label: 'Stable', variant: 'neutral' as BadgeVariant },
  };

  const { icon: Icon, label, variant } = config[trend];

  return (
    <Badge variant={variant}>
      <Icon className="w-3 h-3 mr-1.5" />
      {label}
    </Badge>
  );
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const config = {
    positive: { label: 'Positive', variant: 'success' as BadgeVariant },
    neutral: { label: 'Neutral', variant: 'neutral' as BadgeVariant },
    negative: { label: 'Negative', variant: 'danger' as BadgeVariant },
  };

  const { label, variant } = config[sentiment];

  return <Badge variant={variant}>{label}</Badge>;
}
