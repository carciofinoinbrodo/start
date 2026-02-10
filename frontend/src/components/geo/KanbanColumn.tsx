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
    headerBg: 'bg-[var(--pastel-slate)]',
    headerBorder: 'border-[var(--pastel-slate-accent)]',
    headerText: 'text-[var(--pastel-slate-text)]',
    badgeBg: 'bg-[var(--pastel-slate-accent)]',
    emptyText: 'No pending tasks',
  },
  in_progress: {
    title: 'In Progress',
    icon: Clock,
    headerBg: 'bg-[var(--status-info-bg)]',
    headerBorder: 'border-[var(--status-info-border)]',
    headerText: 'text-[var(--status-info-text)]',
    badgeBg: 'bg-[var(--status-info-border)]',
    emptyText: 'Nothing in progress',
  },
  done: {
    title: 'Done',
    icon: CheckCircle2,
    headerBg: 'bg-[var(--status-success-bg)]',
    headerBorder: 'border-[var(--status-success-border)]',
    headerText: 'text-[var(--status-success-text)]',
    badgeBg: 'bg-[var(--status-success-border)]',
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
