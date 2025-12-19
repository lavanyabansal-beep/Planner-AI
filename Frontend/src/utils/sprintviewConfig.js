/**
 * SprintView Chart Visualization Configuration
 * Defines visual styling for different activity types
 */

export const ACTIVITY_TYPE_CONFIG = {
  ONE_TIME: {
    label: 'One-Time Task',
    color: '#3b82f6', // Blue
    borderStyle: 'solid',
    opacity: 1,
    className: 'rounded-md h-7',
    description: 'Standard task with fixed duration'
  },
  
  CONTINUOUS: {
    label: 'Continuous Task',
    color: '#8b5cf6', // Purple
    borderStyle: 'solid',
    opacity: 0.85,
    className: 'rounded-md h-7',
    description: 'Task that runs until project end'
  },
  
  API_1_DAY: {
    label: 'API Integration',
    color: '#10b981', // Green
    borderStyle: 'solid',
    opacity: 1,
    className: 'rounded-md h-5',
    description: 'API integration task (always 1 day)'
  },
  
  RECURRING_WEEKLY: {
    label: 'Recurring Weekly',
    color: '#f59e0b', // Amber
    borderStyle: 'solid',
    opacity: 0.9,
    className: 'rounded-md h-6',
    description: 'Task that repeats weekly'
  },
  
  MILESTONE: {
    label: 'Milestone',
    color: '#ef4444', // Red
    borderStyle: 'solid',
    opacity: 1,
    className: 'rotate-45 h-4 w-4',
    description: 'Zero-duration checkpoint'
  },
  
  BUFFER: {
    label: 'Buffer/Padding',
    color: '#6b7280', // Gray
    borderStyle: 'dashed',
    opacity: 0.6,
    className: 'rounded-md h-6',
    description: 'Risk padding (blocks owner availability)'
  },
  
  PARALLEL_ALLOWED: {
    label: 'Parallel Task',
    color: '#06b6d4', // Cyan
    borderStyle: 'solid',
    opacity: 0.7,
    className: 'rounded-md h-7',
    description: 'Can overlap with other tasks for same owner'
  }
};

export const WORKING_DAYS_PER_WEEK = 5;

/**
 * Convert days to weeks (ceiling)
 */
export function dayToWeek(day) {
  return Math.ceil(day / WORKING_DAYS_PER_WEEK);
}

/**
 * Convert weeks to days (start of week)
 */
export function weekToDay(week) {
  return (week - 1) * WORKING_DAYS_PER_WEEK + 1;
}

/**
 * Format duration for display
 */
export function formatDuration(days, weeks) {
  if (days === 0) return 'Milestone';
  if (days === 1) return '1 day';
  if (weeks === 1) return `${days} days (1 week)`;
  return `${days} days (${weeks} weeks)`;
}

/**
 * Get color for owner (consistent hashing)
 */
const OWNER_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function getOwnerColor(ownerName) {
  const hash = ownerName.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  return OWNER_COLORS[hash % OWNER_COLORS.length];
}

/**
 * Sort tasks for optimal SprintView display
 */
export function sortTasksForSprintView(tasks) {
  return [...tasks].sort((a, b) => {
    // First by owner
    if (a.taskOwner !== b.taskOwner) {
      return a.taskOwner.localeCompare(b.taskOwner);
    }
    // Then by start day
    return a.startDay - b.startDay;
  });
}

/**
 * Calculate project statistics
 */
export function calculateProjectStats(scheduledTasks, totalProjectWeeks) {
  const stats = {
    totalTasks: scheduledTasks.length,
    totalWeeks: totalProjectWeeks,
    totalWorkingDays: totalProjectWeeks * WORKING_DAYS_PER_WEEK,
    owners: new Set(scheduledTasks.map(t => t.taskOwner)).size,
    activityTypes: {},
    longestTask: null,
    shortestTask: null
  };

  // Count activity types
  scheduledTasks.forEach(task => {
    const type = task.activityType || 'ONE_TIME';
    stats.activityTypes[type] = (stats.activityTypes[type] || 0) + 1;

    // Track longest/shortest
    if (!stats.longestTask || task.durationDays > stats.longestTask.durationDays) {
      stats.longestTask = task;
    }
    if (!stats.shortestTask || task.durationDays < stats.shortestTask.durationDays) {
      stats.shortestTask = task;
    }
  });

  return stats;
}

/**
 * Export SprintView data to CSV
 */
export function exportSprintViewToCSV(scheduledTasks, totalProjectWeeks) {
  const headers = [
    'Task Name',
    'Owner',
    'Activity Type',
    'Duration (Days)',
    'Start Day',
    'End Day',
    'Start Week',
    'End Week'
  ];

  const rows = scheduledTasks.map(task => [
    task.taskName,
    task.taskOwner,
    task.activityType,
    task.durationDays,
    task.startDay,
    task.endDay,
    task.startWeek,
    task.endWeek
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(csv, filename = 'sprintview-chart.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
