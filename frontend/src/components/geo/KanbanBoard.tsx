import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import {
  generateRecommendations,
  getRecommendations,
  updateRecommendationStatus,
  type Recommendation,
} from '../../api/client';

interface KanbanBoardProps {
  brandId?: string;
}

type Status = 'todo' | 'in_progress' | 'done';

// Mock data for demo/fallback when API is unavailable
const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'mock-1',
    rank: 1,
    title: 'Add FAQ schema to all comparison pages',
    description: 'Implement structured FAQ markup to help AI models extract key information about your platform.',
    category: 'technical',
    priority: 'high',
    effort: '1d',
    status: 'todo',
    steps: ['Identify top comparison pages', 'Create FAQ content for each', 'Add JSON-LD schema markup', 'Test with Schema validator'],
  },
  {
    id: 'mock-2',
    rank: 2,
    title: 'Optimize homepage with answer-first structure',
    description: 'Restructure homepage content to lead with direct answers that AI can easily extract.',
    category: 'technical',
    priority: 'low',
    effort: '4h',
    status: 'todo',
    steps: ['Audit current homepage structure', 'Identify key questions users ask', 'Rewrite with answers first'],
  },
  {
    id: 'mock-3',
    rank: 3,
    title: "Counter WooCommerce's open-source positioning",
    description: 'Create content highlighting your advantages over open-source alternatives.',
    category: 'competitive',
    priority: 'low',
    effort: '2d',
    status: 'todo',
    steps: ['Research competitor messaging', 'Identify unique value props', 'Create comparison content'],
  },
  {
    id: 'mock-4',
    rank: 4,
    title: 'Add transaction fee comparison to pricing page',
    description: 'Clearly display transaction fee comparisons to help AI recommend your platform for cost-conscious users.',
    category: 'content',
    priority: 'critical',
    effort: '4h',
    status: 'in_progress',
    steps: ['Gather competitor fee data', 'Create comparison table', 'Add to pricing page'],
  },
  {
    id: 'mock-5',
    rank: 5,
    title: 'Implement llms.txt for AI crawler guidance',
    description: 'Add llms.txt file to guide AI crawlers to your most important content.',
    category: 'technical',
    priority: 'high',
    effort: '2h',
    status: 'in_progress',
    steps: ['Review llms.txt specification', 'Identify priority pages', 'Create and deploy llms.txt'],
  },
  {
    id: 'mock-6',
    rank: 6,
    title: 'Create digital products selling guide',
    description: 'Comprehensive guide for selling digital products to capture informational queries.',
    category: 'content',
    priority: 'medium',
    effort: '2d',
    status: 'in_progress',
    steps: ['Research top digital product questions', 'Outline guide structure', 'Write and publish'],
  },
  {
    id: 'mock-7',
    rank: 7,
    title: 'Publish on Hostinger and Forbes contributor network',
    description: 'Get featured on high-authority sites to boost AI visibility and trust signals.',
    category: 'outreach',
    priority: 'medium',
    effort: '3d',
    status: 'in_progress',
    steps: ['Research contributor guidelines', 'Pitch article ideas', 'Write and submit'],
  },
  {
    id: 'mock-8',
    rank: 8,
    title: 'Create dropshipping platform comparison guide',
    description: 'Detailed comparison guide targeting high-intent dropshipping queries.',
    category: 'content',
    priority: 'critical',
    effort: '3d',
    status: 'done',
    steps: ['Research dropshipping competitors', 'Create comparison criteria', 'Write comprehensive guide'],
  },
  {
    id: 'mock-9',
    rank: 9,
    title: 'Target Reddit r/ecommerce and r/shopify',
    description: 'Build presence on Reddit communities where ecommerce decisions are discussed.',
    category: 'outreach',
    priority: 'high',
    effort: '1w',
    status: 'done',
    steps: ['Join relevant subreddits', 'Provide helpful answers', 'Build reputation organically'],
  },
  {
    id: 'mock-10',
    rank: 10,
    title: "Close Shopify's SEO features gap",
    description: 'Create content addressing SEO feature comparisons with Shopify.',
    category: 'competitive',
    priority: 'medium',
    effort: '1d',
    status: 'done',
    steps: ['Audit Shopify SEO claims', 'Document your SEO advantages', 'Create comparison content'],
  },
];

export function KanbanBoard({ brandId = 'wix' }: KanbanBoardProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [progress, setProgress] = useState({ todo: 0, in_progress: 0, done: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  // Load existing recommendations on mount (fallback to mock data)
  useEffect(() => {
    const loadExisting = async () => {
      setIsLoading(true);
      try {
        const data = await getRecommendations(brandId);
        setRecommendations(data.recommendations);
        setProgress(data.progress);
        setHasData(true);
        setError(null);
      } catch {
        // API unavailable - use mock data for demo
        const todoCount = MOCK_RECOMMENDATIONS.filter(r => r.status === 'todo').length;
        const inProgressCount = MOCK_RECOMMENDATIONS.filter(r => r.status === 'in_progress').length;
        const doneCount = MOCK_RECOMMENDATIONS.filter(r => r.status === 'done').length;
        setRecommendations(MOCK_RECOMMENDATIONS);
        setProgress({ todo: todoCount, in_progress: inProgressCount, done: doneCount });
        setHasData(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadExisting();
  }, [brandId]);

  // Generate new recommendations (fallback to mock data)
  const handleGenerate = useCallback(async (forceRefresh = false) => {
    setIsGenerating(true);
    setError(null);
    try {
      const data = await generateRecommendations(brandId, forceRefresh);
      setRecommendations(data.recommendations);
      setProgress(data.progress);
      setHasData(true);
    } catch {
      // API unavailable - use mock data for demo
      const todoCount = MOCK_RECOMMENDATIONS.filter(r => r.status === 'todo').length;
      const inProgressCount = MOCK_RECOMMENDATIONS.filter(r => r.status === 'in_progress').length;
      const doneCount = MOCK_RECOMMENDATIONS.filter(r => r.status === 'done').length;
      setRecommendations(MOCK_RECOMMENDATIONS);
      setProgress({ todo: todoCount, in_progress: inProgressCount, done: doneCount });
      setHasData(true);
    } finally {
      setIsGenerating(false);
    }
  }, [brandId]);

  // Handle drag end
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { draggableId, destination, source } = result;

    // Dropped outside a droppable
    if (!destination) return;

    // No change
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatus = destination.droppableId as Status;
    const recommendation = recommendations.find(r => r.id === draggableId);
    if (!recommendation) return;

    // Update local state
    setRecommendations(prev =>
      prev.map(r => r.id === draggableId ? { ...r, status: newStatus } : r)
    );

    // Update progress
    const newProgress = { todo: 0, in_progress: 0, done: 0 };
    recommendations.forEach(r => {
      if (r.id === draggableId) {
        newProgress[newStatus]++;
      } else {
        newProgress[r.status]++;
      }
    });
    setProgress(newProgress);

    // Persist to backend (silently fail if API unavailable - local state is already updated)
    try {
      await updateRecommendationStatus(draggableId, newStatus);
    } catch {
      // API unavailable - keep local state (don't revert for demo mode)
    }
  }, [recommendations, progress]);

  // Group recommendations by status
  const todoRecs = recommendations.filter(r => r.status === 'todo');
  const inProgressRecs = recommendations.filter(r => r.status === 'in_progress');
  const doneRecs = recommendations.filter(r => r.status === 'done');

  // Progress percentage
  const totalRecs = recommendations.length || 10;
  const completedPercent = Math.round((progress.done / totalRecs) * 100);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-[var(--bg-hover)] rounded w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[400px] bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state - no recommendations yet
  if (!hasData && !isGenerating) {
    return (
      <div className="empty-state animate-fade-in-up">
        <div className="empty-state-illustration">
          <Sparkles className="w-8 h-8 text-[var(--accent-primary)]" />
        </div>
        <h3 className="empty-state-title text-xl">
          GEO Strategy Advisor
        </h3>
        <p className="empty-state-description">
          Generate AI-powered recommendations to improve your visibility in AI search engines.
          Track your progress with our Kanban board.
        </p>
        <div className="empty-state-action">
          <button
            onClick={() => handleGenerate(false)}
            disabled={isGenerating}
            className="btn btn-primary"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Recommendations
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header card with progress */}
      <div className="card p-4 sm:p-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            {/* Progress bar */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Progress
              </h3>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {progress.done}/{totalRecs} completed ({completedPercent}%)
              </span>
            </div>
            <div className="h-3 bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completedPercent}%` }}
              />
            </div>
          </div>

          {/* Regenerate button */}
          <button
            onClick={() => handleGenerate(true)}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-visible)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card)] hover:border-[var(--border-accent)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-[var(--status-error-bg)] border border-[var(--status-error-border)] text-[var(--status-error-text)] animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Generating overlay */}
      {isGenerating && hasData && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--accent-glow)] border border-[var(--accent-primary)]/30">
          <RefreshCw className="w-5 h-5 text-[var(--accent-primary)] animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">
            Regenerating recommendations... This may take a moment.
          </p>
        </div>
      )}

      {/* Kanban columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-4">
          <KanbanColumn status="todo" recommendations={todoRecs} />
          <KanbanColumn status="in_progress" recommendations={inProgressRecs} />
          <KanbanColumn status="done" recommendations={doneRecs} />
        </div>
      </DragDropContext>

      {/* Stats footer */}
      <div className="card p-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--pastel-slate-text)]" />
            <span className="text-sm text-[var(--text-primary)]">To Do: {progress.todo}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--status-info-text)]" />
            <span className="text-sm text-[var(--text-primary)]">In Progress: {progress.in_progress}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--status-success-text)]" />
            <span className="text-sm text-[var(--text-primary)]">Done: {progress.done}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
