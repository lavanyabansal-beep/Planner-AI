/**
 * Enterprise-Grade SprintView Chart Scheduler
 * Implements standard SprintView chart theory with resource leveling
 * 
 * Core Principles:
 * - 1 Week = 5 Working Days
 * - Tasks with same owner execute sequentially (resource constraint)
 * - Tasks with different owners can run in parallel
 * - Multiple activity types with specific scheduling rules
 */

const WORKING_DAYS_PER_WEEK = 5;

/**
 * Activity Types and their scheduling behavior
 */
const ACTIVITY_TYPES = {
  ONE_TIME: 'ONE_TIME',
  CONTINUOUS: 'CONTINUOUS',
  API_1_DAY: 'API_1_DAY',
  RECURRING_WEEKLY: 'RECURRING_WEEKLY',
  MILESTONE: 'MILESTONE',
  BUFFER: 'BUFFER',
  PARALLEL_ALLOWED: 'PARALLEL_ALLOWED'
};

/**
 * Convert day number to week number
 * @param {number} day - Day number (1-based)
 * @returns {number} Week number
 */
function dayToWeek(day) {
  return Math.ceil(day / WORKING_DAYS_PER_WEEK);
}

/**
 * Calculate duration based on activity type
 * @param {Object} task - Task object
 * @returns {number} Duration in working days
 */
function calculateDuration(task) {
  const { activityType, tentativeEtaDays } = task;

  switch (activityType) {
    case ACTIVITY_TYPES.API_1_DAY:
      return 1;
    
    case ACTIVITY_TYPES.MILESTONE:
      return 0;
    
    case ACTIVITY_TYPES.RECURRING_WEEKLY:
      return 1; // 1 day per week
    
    case ACTIVITY_TYPES.ONE_TIME:
    case ACTIVITY_TYPES.BUFFER:
    case ACTIVITY_TYPES.CONTINUOUS:
    case ACTIVITY_TYPES.PARALLEL_ALLOWED:
    default:
      return tentativeEtaDays || 1;
  }
}

/**
 * Check if task can overlap with others for same owner
 * @param {string} activityType - Activity type
 * @returns {boolean}
 */
function canOverlap(activityType) {
  return activityType === ACTIVITY_TYPES.PARALLEL_ALLOWED;
}

/**
 * Main SprintView Scheduling Algorithm
 * Implements resource-aware task scheduling with proper sequencing
 * 
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Scheduled tasks and project metadata
 */
function scheduleSprintViewTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    return {
      scheduledTasks: [],
      totalProjectDays: 0,
      totalProjectWeeks: 0,
      ownerTimelines: {}
    };
  }

  // Track next available day for each owner
  const ownerAvailability = {};
  
  // Track continuous tasks that need end date adjustment
  const continuousTasks = [];
  
  // Results array
  const scheduledTasks = [];

  // Process tasks in order (FIFO per owner)
  tasks.forEach((task, index) => {
    const {
      taskName,
      tentativeEtaDays,
      activityType,
      taskOwner
    } = task;

    // Initialize owner availability
    if (!ownerAvailability[taskOwner]) {
      ownerAvailability[taskOwner] = 1; // Start at Day 1
    }

    // Calculate duration
    const durationDays = calculateDuration(task);

    // Determine start day
    let startDay;
    
    if (canOverlap(activityType)) {
      // PARALLEL_ALLOWED: Start at Day 1, doesn't block owner
      startDay = 1;
    } else {
      // Sequential: Start at next available day for this owner
      startDay = ownerAvailability[taskOwner];
    }

    // Calculate end day
    let endDay;
    
    if (activityType === ACTIVITY_TYPES.MILESTONE) {
      // Milestone: No duration
      endDay = startDay;
    } else if (activityType === ACTIVITY_TYPES.CONTINUOUS) {
      // Continuous: Mark for later adjustment to project end
      endDay = startDay + durationDays - 1;
      continuousTasks.push(scheduledTasks.length); // Store index
    } else if (activityType === ACTIVITY_TYPES.RECURRING_WEEKLY) {
      // Recurring: 1 day per week, doesn't block full week
      endDay = startDay; // Each occurrence is 1 day
    } else {
      // ONE_TIME, BUFFER, API_1_DAY
      endDay = startDay + durationDays - 1;
    }

    // Update owner availability (only if not parallel)
    if (!canOverlap(activityType) && activityType !== ACTIVITY_TYPES.RECURRING_WEEKLY) {
      ownerAvailability[taskOwner] = endDay + 1;
    } else if (activityType === ACTIVITY_TYPES.RECURRING_WEEKLY) {
      // Recurring weekly: Increment by 1 day (doesn't block full duration)
      ownerAvailability[taskOwner] = startDay + 1;
    }

    // Calculate weeks
    const startWeek = dayToWeek(startDay);
    const endWeek = dayToWeek(endDay);

    // Create scheduled task
    const scheduledTask = {
      taskName,
      taskOwner,
      activityType,
      tentativeEtaDays,
      durationDays,
      startDay,
      endDay,
      startWeek,
      endWeek
    };

    scheduledTasks.push(scheduledTask);
  });

  // Calculate total project duration
  const totalProjectDays = Math.max(...scheduledTasks.map(t => t.endDay), 0);
  const totalProjectWeeks = dayToWeek(totalProjectDays);

  // Update CONTINUOUS tasks to extend to project end
  continuousTasks.forEach(index => {
    scheduledTasks[index].endDay = totalProjectDays;
    scheduledTasks[index].endWeek = totalProjectWeeks;
    scheduledTasks[index].durationDays = totalProjectDays - scheduledTasks[index].startDay + 1;
  });

  // Build owner timeline summary
  const ownerTimelines = {};
  Object.keys(ownerAvailability).forEach(owner => {
    const ownerTasks = scheduledTasks.filter(t => t.taskOwner === owner);
    ownerTimelines[owner] = {
      totalTasks: ownerTasks.length,
      lastAvailableDay: ownerAvailability[owner],
      tasks: ownerTasks.map(t => t.taskName)
    };
  });

  return {
    scheduledTasks,
    totalProjectDays,
    totalProjectWeeks,
    ownerTimelines,
    metadata: {
      totalTasks: tasks.length,
      workingDaysPerWeek: WORKING_DAYS_PER_WEEK,
      scheduledAt: new Date().toISOString()
    }
  };
}

/**
 * Generate recurring task occurrences across weeks
 * @param {Object} task - Scheduled recurring task
 * @param {number} totalWeeks - Total project weeks
 * @returns {Array} Array of task occurrences
 */
function expandRecurringTask(task, totalWeeks) {
  if (task.activityType !== ACTIVITY_TYPES.RECURRING_WEEKLY) {
    return [task];
  }

  const occurrences = [];
  for (let week = task.startWeek; week <= totalWeeks; week++) {
    const dayInWeek = (week - 1) * WORKING_DAYS_PER_WEEK + 1; // First day of week
    occurrences.push({
      ...task,
      startDay: dayInWeek,
      endDay: dayInWeek,
      startWeek: week,
      endWeek: week,
      isRecurringOccurrence: true,
      occurrenceWeek: week
    });
  }
  return occurrences;
}

/**
 * Validate input tasks
 * @param {Array} tasks - Tasks to validate
 * @returns {Object} Validation result
 */
function validateTasks(tasks) {
  const errors = [];

  if (!Array.isArray(tasks)) {
    return { valid: false, errors: ['Tasks must be an array'] };
  }

  tasks.forEach((task, index) => {
    if (!task.taskName) {
      errors.push(`Task ${index}: taskName is required`);
    }
    if (!task.taskOwner) {
      errors.push(`Task ${index}: taskOwner is required`);
    }
    if (task.tentativeEtaDays !== undefined && (typeof task.tentativeEtaDays !== 'number' || task.tentativeEtaDays < 0)) {
      errors.push(`Task ${index}: tentativeEtaDays must be a positive number`);
    }
    if (task.activityType && !Object.values(ACTIVITY_TYPES).includes(task.activityType)) {
      errors.push(`Task ${index}: invalid activityType "${task.activityType}"`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  scheduleSprintViewTasks,
  expandRecurringTask,
  validateTasks,
  ACTIVITY_TYPES,
  WORKING_DAYS_PER_WEEK
};
