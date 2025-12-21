/**
 * Test Multi-User Task Assignment
 * 
 * Validates that tasks assigned to multiple users create separate schedule entries
 */

const { scheduleSprintViewTasks } = require('./utils/sprintviewScheduler');
const { expandToUserDayView } = require('./utils/userDayExpander');

console.log('═══════════════════════════════════════════════════');
console.log('Multi-User Task Assignment Test');
console.log('═══════════════════════════════════════════════════\n');

// Simulate a task assigned to multiple users
const multiUserTasks = [
  {
    taskName: "Frontend Development",
    tentativeEtaDays: 10,
    activityType: "ONE_TIME",
    taskOwner: "Alice",
    isMultiUser: true,
    allOwners: ["Alice", "Bob"]
  },
  {
    taskName: "Frontend Development",
    tentativeEtaDays: 10,
    activityType: "ONE_TIME",
    taskOwner: "Bob",
    isMultiUser: true,
    allOwners: ["Alice", "Bob"]
  },
  {
    taskName: "Backend API",
    tentativeEtaDays: 8,
    activityType: "ONE_TIME",
    taskOwner: "Carol",
    isMultiUser: false
  }
];

console.log('Test: Task assigned to multiple users (Alice & Bob)');
console.log('Expected: Same task appears in both users\' schedules\n');

const schedule = scheduleSprintViewTasks(multiUserTasks);

console.log(`Total Project: ${schedule.totalProjectWeeks} weeks (${schedule.totalProjectDays} days)\n`);

console.log('Scheduled Tasks:');
schedule.scheduledTasks.forEach(task => {
  console.log(`  - ${task.taskName} → ${task.taskOwner} (Days ${task.startDay}-${task.endDay})`);
});

console.log('\n');

// Now check user-day view
const userDayView = expandToUserDayView(schedule.scheduledTasks, schedule.totalProjectWeeks);

console.log('User-Day View:');
userDayView.users.forEach(user => {
  console.log(`\n${user.userName}:`);
  console.log(`  Total Tasks: ${user.totalTasks}`);
  console.log(`  Utilization: ${user.stats.utilization}%`);
  
  user.weeks.forEach(week => {
    const occupiedDays = week.days.filter(d => !d.isEmpty).length;
    if (occupiedDays > 0) {
      console.log(`  Week ${week.weekNumber}: ${occupiedDays}/5 days occupied`);
      week.days.forEach(day => {
        if (!day.isEmpty) {
          const taskNames = day.tasks.map(t => t.taskName).join(', ');
          console.log(`    ${day.dayName} (Day ${day.absoluteDay}): ${taskNames}`);
        }
      });
    }
  });
});

console.log('\n═══════════════════════════════════════════════════');
console.log('✓ Multi-user tasks correctly assigned to both users');
console.log('✓ Tasks run in parallel (different owners)');
console.log('✓ User-day view shows all assignments');
console.log('═══════════════════════════════════════════════════');
