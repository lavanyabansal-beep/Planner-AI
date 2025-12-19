import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AvatarGroup from '../common/AvatarGroup';
import { formatDate, getPriorityColorDark } from '../../utils/helpers';

// Activity Type Configuration
const getActivityConfig = (activityType) => {
  const type = (activityType || '').toUpperCase();
  
  // Match exact activity type constants from backend
  const activityMap = {
    'ONE_TIME': {
      icon: '🎯',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      label: 'One-Time',
      description: 'Standard task with fixed duration'
    },
    'CONTINUOUS': {
      icon: '♾️',
      color: 'bg-green-500/20 text-green-300 border-green-500/40',
      label: 'Continuous',
      description: 'Task that runs until project end'
    },
    'API_1_DAY': {
      icon: '⚡',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      label: 'API/1-Day',
      description: 'API integration (always 1 day)'
    },
    'RECURRING_WEEKLY': {
      icon: '🔄',
      color: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      label: 'Recurring Weekly',
      description: 'Task that repeats weekly'
    },
    'MILESTONE': {
      icon: '🏁',
      color: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
      label: 'Milestone',
      description: 'Zero-duration checkpoint'
    },
    'BUFFER': {
      icon: '🛡️',
      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      label: 'Buffer',
      description: 'Risk padding for schedule'
    },
    'PARALLEL_ALLOWED': {
      icon: '🔀',
      color: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      label: 'Parallel Allowed',
      description: 'Can overlap with other tasks'
    }
  };
  
  return activityMap[type] || {
    icon: '💼',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
    label: 'Task',
    description: 'General task'
  };
};

const TaskCard = ({ task, users = [], onClick, onToggleComplete }) => {
  // Populate assigned users with full user objects
  const populatedAssignedTo = (task.assignedTo || []).map(userId => {
    if (typeof userId === 'string') {
      return users.find(u => u._id === userId) || { _id: userId, name: 'Unknown' };
    }
    return userId;
  }).filter(Boolean);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id, data: { type: 'task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChecklist = task.checklist && task.checklist.length > 0;
  const completedChecklist = task.checklist?.filter(item => item.done).length || 0;
  const totalChecklist = task.checklist?.length || 0;
  const activityConfig = getActivityConfig(task.activityType);

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onToggleComplete?.(task._id, !task.completed);
  };

  const handleCardClick = (e) => {
    // Don't trigger if clicking on checkbox
    if (e.target.type === 'checkbox') return;
    onClick?.();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="bg-gradient-to-br from-gray-700 to-gray-700/80 backdrop-blur-sm rounded-xl border border-gray-600 p-4 hover:shadow-2xl hover:border-primary-500/50 hover:from-gray-700/90 hover:to-gray-700/70 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800"
    >
      <div className="space-y-3">
        {/* Activity Type Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${activityConfig.color}`} title={activityConfig.description}>
            <span>{activityConfig.icon}</span>
            <span>{activityConfig.label}</span>
          </span>
          {task.estimatedDays > 0 && (
            <span className="px-2 py-1 rounded-lg bg-gray-600/50 text-gray-300 text-xs font-medium" title="Estimated Duration">
              {task.estimatedDays}d
            </span>
          )}
        </div>

        {/* Title with Checkbox */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={task.completed || false}
            onChange={handleCheckboxClick}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 w-5 h-5 text-primary-600 bg-gray-900 border-gray-600 rounded focus:ring-primary-500 focus:ring-offset-gray-700 cursor-pointer flex-shrink-0"
            aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
          />
          <h4 className={`flex-1 font-medium text-white leading-snug ${task.completed ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </h4>
        </div>

        {/* Meta Info */}
        {(task.priority && task.priority !== 'medium') || task.dueDate || hasChecklist || (task.attachments && task.attachments.length > 0) ? (
          <div className="flex flex-wrap gap-2">
            {task.priority && task.priority !== 'medium' && (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getPriorityColorDark(task.priority)}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            )}
            
            {task.dueDate && (
              <span className="px-2.5 py-1 rounded-lg bg-gray-600/50 text-gray-200 text-xs font-medium flex items-center gap-1.5 border border-gray-500/30">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(task.dueDate)}
              </span>
            )}

            {hasChecklist && (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border ${
                completedChecklist === totalChecklist 
                  ? 'bg-success-500/20 text-success-300 border-success-500/30' 
                  : 'bg-gray-600/50 text-gray-200 border-gray-500/30'
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {completedChecklist}/{totalChecklist}
              </span>
            )}

            {task.attachments && task.attachments.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-gray-600/50 text-gray-200 text-xs font-medium flex items-center gap-1.5 border border-gray-500/30">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {task.attachments.length}
              </span>
            )}
          </div>
        ) : null}

        {/* Assigned Users */}
        {populatedAssignedTo.length > 0 && (
          <div className="pt-1 border-t border-gray-600/50">
            <AvatarGroup users={populatedAssignedTo} size="sm" max={4} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
