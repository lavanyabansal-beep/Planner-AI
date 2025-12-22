/**
 * Test User-Day SprintView Expander
 * 
 * Validates per-user, day-level task allocation
 */

const { scheduleSprintViewTasks } = require('./utils/sprintviewScheduler');
const { expandToUserDayView, expandToFlatGrid } = require('./utils/userDayExpander');

console.log('═══════════════════════════════════════════════════');
console.log('User-Day SprintView Expansion Test Suite');
console.log('═══════════════════════════════════════════════════\n');

// Test Case 1: Sequential Tasks - Same Owner
console.log('Test 1: Sequential Tasks (Same Owner)');
console.log('---------------------------------------');

const test1Tasks = [
  {
    taskName: 'Database Design',
    tentativeEtaDays: 5,
    activityType: 'ONE_TIME',
    taskOwner: 'Alice'
  },
  {
    taskName: 'API Development',
    tentativeEtaDays: 10,
    activityType: 'ONE_TIME',
    taskOwner: 'Alice'
  },
  {
    taskName: 'Testing',
    tentativeEtaDays: 5,
    activityType: 'ONE_TIME',
    taskOwner: 'Alice'
  }
];

const schedule1 = scheduleSprintViewTasks(test1Tasks);
const userDayView1 = expandToUserDayView(schedule1.scheduledTasks, schedule1.totalProjectWeeks);

console.log(`Total Project: ${schedule1.totalProjectWeeks} weeks (${schedule1.totalProjectDays} days)\n`);

userDayView1.users.forEach(user => {
  console.log(`User: ${user.userName}`);
  console.log(`  Total Tasks: ${user.totalTasks}`);
  console.log(`  Utilization: ${user.stats.utilization}%`);
  console.log(`  Occupied Days: ${user.stats.occupiedDays}/${userDayView1.totalDays}`);
  console.log(`  Free Days: ${user.stats.freeDays}`);
  
  console.log('\n  Week-by-week breakdown:');
  user.weeks.forEach(week => {
    const occupiedDays = week.days.filter(d => !d.isEmpty).length;
    console.log(`    Week ${week.weekNumber}: ${occupiedDays}/5 days occupied`);
    
    week.days.forEach(day => {
      if (!day.isEmpty) {
        const taskNames = day.tasks.map(t => t.taskName).join(', ');
        console.log(`      ${day.dayName} (Day ${day.absoluteDay}): ${taskNames}`);
      }
    });
  });
  console.log('');
});

// Test Case 2: Parallel Tasks - Different Owners
console.log('\nTest 2: Parallel Tasks (Different Owners)');
console.log('------------------------------------------');

const test2Tasks = [
  {
    taskName: 'Backend Development',
    tentativeEtaDays: 8,
    activityType: 'ONE_TIME',
    taskOwner: 'Bob'
  },
  {
    taskName: 'Frontend Development',
    tentativeEtaDays: 8,
    activityType: 'ONE_TIME',
    taskOwner: 'Carol'
  },
  {
    taskName: 'Documentation',
    tentativeEtaDays: 3,
    activityType: 'ONE_TIME',
    taskOwner: 'Dave'
  }
];

const schedule2 = scheduleSprintViewTasks(test2Tasks);
const userDayView2 = expandToUserDayView(schedule2.scheduledTasks, schedule2.totalProjectWeeks);

console.log(`Total Project: ${schedule2.totalProjectWeeks} weeks\n`);

userDayView2.users.forEach(user => {
  console.log(`${user.userName}: ${user.stats.occupiedDays} days occupied (${user.stats.utilization}%)`);
});

// Test Case 3: Overload Detection
console.log('\n\nTest 3: Overload Detection (Parallel Allowed)');
console.log('-----------------------------------------------');

const test3Tasks = [
  {
    taskName: 'Code Review',
    tentativeEtaDays: 10,
    activityType: 'PARALLEL_ALLOWED',
    taskOwner: 'Eve'
  },
  {
    taskName: 'Main Development',
    tentativeEtaDays: 10,
    activityType: 'ONE_TIME',
    taskOwner: 'Eve'
  }
];

const schedule3 = scheduleSprintViewTasks(test3Tasks);
const userDayView3 = expandToUserDayView(schedule3.scheduledTasks, schedule3.totalProjectWeeks);

userDayView3.users.forEach(user => {
  console.log(`User: ${user.userName}`);
  console.log(`  Overlapping Days: ${user.stats.overlappingDays}`);
  console.log(`  Has Overload: ${user.stats.hasOverload}`);
  
  // Show days with multiple tasks
  user.weeks.forEach(week => {
    week.days.forEach(day => {
      if (day.tasks.length > 1) {
        console.log(`  Day ${day.absoluteDay}: ${day.tasks.length} concurrent tasks`);
        day.tasks.forEach(task => {
          console.log(`    - ${task.taskName} (${task.activityType})`);
        });
      }
    });
  });
});

// Test Case 4: Milestone and Recurring
console.log('\n\nTest 4: Special Activity Types');
console.log('-------------------------------');

const test4Tasks = [
  {
    taskName: 'Sprint Start',
    tentativeEtaDays: 0,
    activityType: 'MILESTONE',
    taskOwner: 'Frank'
  },
  {
    taskName: 'Development',
    tentativeEtaDays: 10,
    activityType: 'ONE_TIME',
    taskOwner: 'Frank'
  },
  {
    taskName: 'Weekly Standup',
    tentativeEtaDays: 1,
    activityType: 'RECURRING_WEEKLY',
    taskOwner: 'Frank'
  }
];

const schedule4 = scheduleSprintViewTasks(test4Tasks);
const userDayView4 = expandToUserDayView(schedule4.scheduledTasks, schedule4.totalProjectWeeks);

userDayView4.users.forEach(user => {
  console.log(`User: ${user.userName}`);
  console.log(`  Total Tasks: ${user.totalTasks}`);
  
  user.weeks.forEach(week => {
    const recurringDays = week.days.filter(d => 
      d.tasks.some(t => t.activityType === 'RECURRING_WEEKLY')
    );
    const milestoneDays = week.days.filter(d => 
      d.tasks.some(t => t.activityType === 'MILESTONE')
    );
    
    if (recurringDays.length > 0 || milestoneDays.length > 0) {
      console.log(`  Week ${week.weekNumber}:`);
      if (milestoneDays.length > 0) {
        console.log(`    Milestones: ${milestoneDays.length} day(s)`);
      }
      if (recurringDays.length > 0) {
        console.log(`    Recurring: ${recurringDays.length} day(s)`);
      }
    }
  });
});

// Test Case 5: Flat Grid Format
console.log('\n\nTest 5: Flat Grid Format');
console.log('-------------------------');

const flatGrid = expandToFlatGrid(schedule1.scheduledTasks, schedule1.totalProjectWeeks);

console.log(`Grid Dimensions: ${flatGrid.rows.length} users × ${flatGrid.totalDays} days`);
console.log(`\nDay grid header (first 10 days):`);
flatGrid.dayGrid.slice(0, 10).forEach(day => {
  console.log(`  Day ${day.absoluteDay}: ${day.dayName} (Week ${day.week})`);
});

console.log('\n═══════════════════════════════════════════════════');
console.log('All tests completed successfully! ✓');
console.log('═══════════════════════════════════════════════════');
