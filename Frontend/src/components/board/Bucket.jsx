import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import AddTaskButton from './AddTaskButton';
import Button from '../common/Button';
import Input from '../common/Input';

const Bucket = ({ bucket, tasks, users = [], onAddTask, onDeleteBucket, onUpdateBucket, onTaskClick, onUpdateTask }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(bucket.title);
  const [showMenu, setShowMenu] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'ONE_TIME', 'CONTINUOUS', 'API_1_DAY', etc.

  // Calculate activity type statistics
  const activityStats = tasks.reduce((acc, task) => {
    const type = (task.activityType || '').toUpperCase();
    switch (type) {
      case 'ONE_TIME':
        acc.oneTime++;
        break;
      case 'CONTINUOUS':
        acc.continuous++;
        break;
      case 'API_1_DAY':
        acc.api++;
        break;
      case 'RECURRING_WEEKLY':
        acc.recurring++;
        break;
      case 'MILESTONE':
        acc.milestone++;
        break;
      case 'BUFFER':
        acc.buffer++;
        break;
      case 'PARALLEL_ALLOWED':
        acc.parallel++;
        break;
      default:
        acc.other++;
    }
    return acc;
  }, { oneTime: 0, continuous: 0, api: 0, recurring: 0, milestone: 0, buffer: 0, parallel: 0, other: 0 });

  // Filter tasks based on selected filter
  const filteredTasks = filterType === 'all' ? tasks : tasks.filter(task => {
    const type = (task.activityType || '').toUpperCase();
    return type === filterType;
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bucket._id, data: { type: 'bucket' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleUpdateTitle = async () => {
    if (title.trim() && title !== bucket.title) {
      try {
        await onUpdateBucket(bucket._id, { title: title.trim() });
      } catch (err) {
        console.error('Failed to update bucket title:', err);
        setTitle(bucket.title);
      }
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (tasks.length > 0) {
      if (!confirm(`Delete "${bucket.title}" and all ${tasks.length} tasks inside?`)) {
        return;
      }
    }
    try {
      await onDeleteBucket(bucket._id);
    } catch (err) {
      console.error('Failed to delete bucket:', err);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-80 bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-elevated flex flex-col max-h-full transition-all hover:shadow-2xl hover:border-gray-600"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-b from-gray-700/50 to-transparent rounded-t-2xl">
        <div className="flex items-center justify-between gap-2">
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateTitle();
                if (e.key === 'Escape') {
                  setTitle(bucket.title);
                  setIsEditing(false);
                }
              }}
              autoFocus
              className="flex-1 bg-gray-900 border-gray-600 text-white"
              ariaLabel="Edit bucket name"
            />
          ) : (
            <>
              <button
                {...listeners}
                {...attributes}
                className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-primary-400 transition-colors p-1 rounded hover:bg-gray-700"
                aria-label="Drag to reorder bucket"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </button>
              <h3
                className="flex-1 font-semibold text-white truncate cursor-pointer hover:text-primary-400 transition-colors"
                onClick={() => setIsEditing(true)}
                title={bucket.title}
              >
                {bucket.title}
              </h3>
              <span className="text-xs font-bold text-primary-400 bg-gray-900/50 px-2.5 py-1 rounded-full min-w-[2rem] text-center border border-primary-500/30">
                {tasks.length}
              </span>
              <div className="relative z-30">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                  aria-label="Bucket options"
                  aria-expanded={showMenu}
                  aria-haspopup="true"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 py-1 z-50 animate-in" role="menu">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
                        role="menuitem"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-red-500/20 hover:text-red-400 transition-colors flex items-center gap-2"
                        role="menuitem"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Activity Type Filter */}
        {tasks.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
              }`}
            >
              All ({tasks.length})
            </button>
            {activityStats.oneTime > 0 && (
              <button
                onClick={() => setFilterType('ONE_TIME')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  filterType === 'ONE_TIME'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                }`}
              >
                🎯 {activityStats.oneTime}
              </button>
            )}
            {activityStats.continuous > 0 && (
              <button
                onClick={() => setFilterType('CONTINUOUS')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  filterType === 'CONTINUOUS'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-500/10 text-green-300 hover:bg-green-500/20'
                }`}
              >
                ♾️ {activityStats.continuous}
              </button>
            )}
            {activityStats.api > 0 && (
              <button
                onClick={() => setFilterType('API_1_DAY')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  filterType === 'API_1_DAY'
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                }`}
              >
                ⚡ {activityStats.api}
              </button>
            )}
            {activityStats.recurring > 0 && (
              <button
                onClick={() => setFilterType('RECURRING_WEEKLY')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  filterType === 'RECURRING_WEEKLY'
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-500/10 text-orange-300 hover:bg-orange-500/20'
                }`}
              >
                🔄 {activityStats.recurring}
              </button>
            )}
            {activityStats.milestone > 0 && (
              <button
                onClick={() => setFilterType('MILESTONE')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  filterType === 'MILESTONE'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-500/10 text-gray-300 hover:bg-gray-500/20'
                }`}
              >
                🏁 {activityStats.milestone}
              </button>
            )}
            {activityStats.buffer > 0 && (
              <button
                onClick={() => setFilterType('BUFFER')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  filterType === 'BUFFER'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20'
                }`}
              >
                🛡️ {activityStats.buffer}
              </button>
            )}
            {activityStats.parallel > 0 && (
              <button
                onClick={() => setFilterType('PARALLEL_ALLOWED')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  filterType === 'PARALLEL_ALLOWED'
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-500/10 text-pink-300 hover:bg-pink-500/20'
                }`}
              >
                🔀 {activityStats.parallel}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-gray-800/30">
        {filteredTasks.length === 0 && filterType !== 'all' ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <p>No {filterType} tasks</p>
            <button
              onClick={() => setFilterType('all')}
              className="mt-2 text-primary-400 hover:text-primary-300 text-xs underline"
            >
              Show all tasks
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No tasks yet</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskCard 
              key={task._id} 
              task={task}
              users={users}
              onClick={() => onTaskClick(task)}
              onToggleComplete={(taskId, completed) => {
                onUpdateTask(taskId, { completed });
              }}
            />
          ))
        )}
      </div>

      {/* Add Task */}
      <div className="p-4 border-t border-gray-700 bg-gradient-to-t from-gray-700/50 to-transparent rounded-b-2xl">
        <AddTaskButton bucketId={bucket._id} onAdd={onAddTask} />
      </div>
    </div>
  );
};

export default Bucket;
