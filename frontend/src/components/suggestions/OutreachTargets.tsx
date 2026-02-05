import { Globe, Newspaper, Radio, MessageCircle, Star, ExternalLink } from 'lucide-react';
import type { OutreachTargetResponse } from '../../api/client';

interface OutreachTargetsProps {
  targets: OutreachTargetResponse[];
}

const TYPE_CONFIG = {
  publication: { icon: Newspaper, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  blog: { icon: Globe, color: 'text-green-400', bg: 'bg-green-500/20' },
  podcast: { icon: Radio, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  community: { icon: MessageCircle, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  'review-site': { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
};

function TargetCard({ target }: { target: OutreachTargetResponse }) {
  const config = TYPE_CONFIG[target.type];
  const Icon = config.icon;

  return (
    <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-colors">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-[var(--text-primary)]">
              {target.name}
            </h4>
            <span className={`px-2 py-0.5 rounded text-xs capitalize ${config.bg} ${config.color}`}>
              {target.type.replace('-', ' ')}
            </span>
          </div>

          <p className="text-sm text-[var(--text-muted)] mt-1">
            {target.why}
          </p>

          <div className="mt-3 p-2 rounded bg-[var(--accent-primary)]/10 flex items-start gap-2">
            <ExternalLink className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--accent-primary)]">
              {target.action}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OutreachTargets({ targets }: OutreachTargetsProps) {
  const groupedByType = targets.reduce((acc, target) => {
    if (!acc[target.type]) acc[target.type] = [];
    acc[target.type].push(target);
    return acc;
  }, {} as Record<string, OutreachTargetResponse[]>);

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-cyan-500/20">
          <Globe className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">Outreach Targets</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Publications and communities to pursue
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {targets.map((target, idx) => (
          <TargetCard key={idx} target={target} />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex flex-wrap gap-2">
          {Object.entries(groupedByType).map(([type, items]) => {
            const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
            return (
              <span key={type} className={`px-2 py-1 rounded text-xs ${config.bg} ${config.color}`}>
                {items.length} {type.replace('-', ' ')}{items.length !== 1 ? 's' : ''}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
