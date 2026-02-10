import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';
import { RecommendationCard } from './RecommendationCard';
import type { Recommendation } from '../../api/client';

interface KanbanColumnProps {
  status: 'todo' | 'in_progress' | 'done';
  recommendations: Recommendation[];
}

const columnConfig = {
  todo: {
    title: 'To Do',
    icon: Circle,
    headerBg: 'bg-slate-100 dark:bg-slate-800/50',
    headerBorder: 'border-slate-300 dark:border-slate-600',
    headerText: 'text-slate-700 dark:text-slate-200',
    badgeBg: 'bg-slate-200 dark:bg-slate-700',
    emptyText: 'No pending tasks',
  },
  in_progress: {
    title: 'In Progress',
    icon: Clock,
    headerBg: 'bg-blue-50 dark:bg-blue-900/30',
    headerBorder: 'border-blue-200 dark:border-blue-700',
    headerText: 'text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-100 dark:bg-blue-800/50',
    emptyText: 'Nothing in progress',
  },
  done: {
    title: 'Done',
    icon: CheckCircle2,
    headerBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    headerBorder: 'border-emerald-200 dark:border-emerald-700',
    headerText: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-800/50',
    emptyText: 'Complete tasks to see them here',
  },
};

export function KanbanColumn({ status, recommendations }: KanbanColumnProps) {
  const config = columnConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex flex-col min-w-[280px] sm:min-w-0 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
      {/* Column Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${config.headerBorder} ${config.headerBg} rounded-t-xl`}>
        <Icon className={`w-4 h-4 ${config.headerText}`} />
        <h3 className={`text-sm font-semibold ${config.headerText}`}>
          {config.title}
        </h3>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeBg} ${config.headerText}`}>
          {recommendations.length}
        </span>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 p-3 space-y-3 min-h-[200px] transition-colors duration-200
              ${snapshot.isDraggingOver ? 'bg-[var(--accent-glow)]' : ''}
            `}
          >
            {recommendations.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[150px]">
                <p className="text-xs text-[var(--text-muted)] text-center">
                  {config.emptyText}
                </p>
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <Draggable key={rec.id} draggableId={rec.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <RecommendationCard
                        recommendation={rec}
                        isDragging={snapshot.isDragging}
                        dragHandleProps={provided.dragHandleProps ?? undefined}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
