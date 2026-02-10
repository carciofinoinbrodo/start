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

export function KanbanBoard({ brandId = 'wix' }: KanbanBoardProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [progress, setProgress] = useState({ todo: 0, in_progress: 0, done: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  // Load existing recommendations on mount
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
        // No existing recommendations - show empty state
        setHasData(false);
      } finally {
        setIsLoading(false);
      }
    };
    loadExisting();
  }, [brandId]);

  // Generate new recommendations
  const handleGenerate = useCallback(async (forceRefresh = false) => {
    setIsGenerating(true);
    setError(null);
    try {
      const data = await generateRecommendations(brandId, forceRefresh);
      setRecommendations(data.recommendations);
      setProgress(data.progress);
      setHasData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
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

    // Optimistic update
    const oldRecommendations = [...recommendations];
    const oldProgress = { ...progress };

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

    // Persist to backend
    try {
      await updateRecommendationStatus(draggableId, newStatus);
    } catch {
      // Revert on error
      setRecommendations(oldRecommendations);
      setProgress(oldProgress);
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
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-glow)] flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-[var(--accent-primary)]" />
        </div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          GEO Strategy Advisor
        </h3>
        <p className="text-sm text-[var(--text-muted)] text-center max-w-md mb-8">
          Generate AI-powered recommendations to improve your visibility in AI search engines.
          Track your progress with our Kanban board.
        </p>
        <button
          onClick={() => handleGenerate(false)}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:bg-[var(--accent-primary)]/90 transition-colors disabled:opacity-50"
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header card with progress */}
      <div className="card p-4 sm:p-6">
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
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
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
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500" />
            <span className="text-sm text-[var(--text-primary)]">To Do: {progress.todo}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-[var(--text-primary)]">In Progress: {progress.in_progress}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-[var(--text-primary)]">Done: {progress.done}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
