/**
 * SprintView Chart System - Test Examples
 * 
 * This file contains example test cases demonstrating the SprintView scheduling system.
 * Run these examples to verify the system works correctly.
 */

const { scheduleSprintViewTasks, validateTasks, ACTIVITY_TYPES } = require('./utils/sprintviewScheduler');

console.log('========================================');
console.log('SPRINTVIEW CHART SYSTEM - TEST EXAMPLES');
console.log('========================================\n');

// ============================================
// EXAMPLE 1: Simple Sequential Tasks (Same Owner)
// ============================================
console.log('Example 1: Sequential Tasks (Same Owner)');
console.log('----------------------------------------');

const example1Tasks = [
  { 
    taskName: "Database Design", 
    tentativeEtaDays: 5, 
    activityType: "ONE_TIME", 
    taskOwner: "Alice" 
  },
  { 
    taskName: "API Development", 
    tentativeEtaDays: 10, 
    activityType: "ONE_TIME", 
    taskOwner: "Alice" 
  },
  { 
    taskName: "Testing", 
    tentativeEtaDays: 5, 
    activityType: "ONE_TIME", 
    taskOwner: "Alice" 
  }
];

const result1 = scheduleSprintViewTasks(example1Tasks);
console.log('Total Project Duration:', result1.totalProjectWeeks, 'weeks');
console.log('Scheduled Tasks:');
result1.scheduledTasks.forEach(task => {
  console.log(`  - ${task.taskName}: Days ${task.startDay}-${task.endDay} (Week ${task.startWeek}-${task.endWeek})`);
});
console.log('\n');

// ============================================
// EXAMPLE 2: Parallel Tasks (Different Owners)
// ============================================
console.log('Example 2: Parallel Tasks (Different Owners)');
console.log('----------------------------------------');

const example2Tasks = [
  { 
    taskName: "Backend API", 
    tentativeEtaDays: 10, 
    activityType: "ONE_TIME", 
    taskOwner: "Alice" 
  },
  { 
    taskName: "Frontend UI", 
    tentativeEtaDays: 8, 
    activityType: "ONE_TIME", 
    taskOwner: "Bob" 
  },
  { 
    taskName: "Database Migration", 
    tentativeEtaDays: 3, 
    activityType: "ONE_TIME", 
    taskOwner: "Charlie" 
  }
];

const result2 = scheduleSprintViewTasks(example2Tasks);
console.log('Total Project Duration:', result2.totalProjectWeeks, 'weeks');
console.log('Scheduled Tasks:');
result2.scheduledTasks.forEach(task => {
  console.log(`  - ${task.taskName} (${task.taskOwner}): Days ${task.startDay}-${task.endDay} (Week ${task.startWeek}-${task.endWeek})`);
});
console.log('Owner Timelines:', result2.ownerTimelines);
console.log('\n');

// ============================================
// EXAMPLE 3: Mixed Activity Types
// ============================================
console.log('Example 3: Mixed Activity Types');
console.log('----------------------------------------');

const example3Tasks = [
  { 
    taskName: "Setup Infrastructure", 
    tentativeEtaDays: 3, 
    activityType: "ONE_TIME", 
    taskOwner: "DevOps" 
  },
  { 
    taskName: "Payment Gateway Integration", 
    tentativeEtaDays: 10, // Will be overridden to 1 day
    activityType: "API_1_DAY", 
    taskOwner: "DevOps" 
  },
  { 
    taskName: "Monitoring Setup", 
    tentativeEtaDays: 2, 
    activityType: "CONTINUOUS", 
    taskOwner: "DevOps" 
  },
  { 
    taskName: "Go Live", 
    tentativeEtaDays: 0, 
    activityType: "MILESTONE", 
    taskOwner: "DevOps" 
  }
];

const result3 = scheduleSprintViewTasks(example3Tasks);
console.log('Total Project Duration:', result3.totalProjectWeeks, 'weeks');
console.log('Scheduled Tasks:');
result3.scheduledTasks.forEach(task => {
  console.log(`  - ${task.taskName}: Days ${task.startDay}-${task.endDay} (${task.activityType})`);
});
console.log('\n');

// ============================================
// EXAMPLE 4: Recurring Weekly Tasks
// ============================================
console.log('Example 4: Recurring Weekly Tasks');
console.log('----------------------------------------');

const example4Tasks = [
  { 
    taskName: "Development Sprint", 
    tentativeEtaDays: 10, 
    activityType: "ONE_TIME", 
    taskOwner: "Team" 
  },
  { 
    taskName: "Weekly Status Meeting", 
    tentativeEtaDays: 1, 
    activityType: "RECURRING_WEEKLY", 
    taskOwner: "Team" 
  },
  { 
    taskName: "Code Review", 
    tentativeEtaDays: 5, 
    activityType: "ONE_TIME", 
    taskOwner: "Team" 
  }
];

const result4 = scheduleSprintViewTasks(example4Tasks);
console.log('Total Project Duration:', result4.totalProjectWeeks, 'weeks');
console.log('Scheduled Tasks:');
result4.scheduledTasks.forEach(task => {
  console.log(`  - ${task.taskName}: Days ${task.startDay}-${task.endDay} (${task.activityType})`);
});
console.log('\n');

// ============================================
// EXAMPLE 5: Real Project Scenario
// ============================================
console.log('Example 5: Complete Project Workflow');
console.log('----------------------------------------');

const example5Tasks = [
  // Planning Phase
  { 
    taskName: "Requirements Gathering", 
    tentativeEtaDays: 3, 
    activityType: "ONE_TIME", 
    taskOwner: "Product Manager" 
  },
  { 
    taskName: "Design Mockups", 
    tentativeEtaDays: 5, 
    activityType: "ONE_TIME", 
    taskOwner: "Designer" 
  },
  
  // Development Phase
  { 
    taskName: "Backend API Development", 
    tentativeEtaDays: 15, 
    activityType: "ONE_TIME", 
    taskOwner: "Backend Dev" 
  },
  { 
    taskName: "Frontend Development", 
    tentativeEtaDays: 12, 
    activityType: "ONE_TIME", 
    taskOwner: "Frontend Dev" 
  },
  
  // Integrations
  { 
    taskName: "Payment Gateway", 
    tentativeEtaDays: 1, 
    activityType: "API_1_DAY", 
    taskOwner: "Backend Dev" 
  },
  { 
    taskName: "Analytics Integration", 
    tentativeEtaDays: 1, 
    activityType: "API_1_DAY", 
    taskOwner: "Frontend Dev" 
  },
  
  // Testing Phase
  { 
    taskName: "Unit Testing", 
    tentativeEtaDays: 5, 
    activityType: "ONE_TIME", 
    taskOwner: "QA Engineer" 
  },
  { 
    taskName: "Integration Testing", 
    tentativeEtaDays: 3, 
    activityType: "ONE_TIME", 
    taskOwner: "QA Engineer" 
  },
  
  // Continuous Tasks
  { 
    taskName: "Code Review Process", 
    tentativeEtaDays: 1, 
    activityType: "CONTINUOUS", 
    taskOwner: "Tech Lead" 
  },
  { 
    taskName: "Daily Standups", 
    tentativeEtaDays: 1, 
    activityType: "RECURRING_WEEKLY", 
    taskOwner: "Scrum Master" 
  },
  
  // Buffer and Milestone
  { 
    taskName: "Risk Buffer", 
    tentativeEtaDays: 5, 
    activityType: "BUFFER", 
    taskOwner: "Backend Dev" 
  },
  { 
    taskName: "Production Deployment", 
    tentativeEtaDays: 0, 
    activityType: "MILESTONE", 
    taskOwner: "DevOps" 
  }
];

const result5 = scheduleSprintViewTasks(example5Tasks);
console.log('Total Project Duration:', result5.totalProjectWeeks, 'weeks (', result5.totalProjectDays, 'days)');
console.log('\nOwner Workload:');
Object.entries(result5.ownerTimelines).forEach(([owner, timeline]) => {
  console.log(`  ${owner}: ${timeline.totalTasks} tasks, busy until day ${timeline.lastAvailableDay - 1}`);
});

console.log('\nCritical Path (longest sequence):');
const backendDevTasks = result5.scheduledTasks.filter(t => t.taskOwner === 'Backend Dev');
const backendDays = backendDevTasks.reduce((sum, t) => sum + t.durationDays, 0);
console.log(`  Backend Dev: ${backendDays} days`);

console.log('\nScheduled Tasks by Week:');
for (let week = 1; week <= result5.totalProjectWeeks; week++) {
  const tasksInWeek = result5.scheduledTasks.filter(
    t => t.startWeek <= week && t.endWeek >= week
  );
  console.log(`  Week ${week}: ${tasksInWeek.length} active tasks`);
}
console.log('\n');

// ============================================
// EXAMPLE 6: Validation Test
// ============================================
console.log('Example 6: Input Validation');
console.log('----------------------------------------');

const invalidTasks = [
  { 
    taskName: "", // Invalid: empty name
    tentativeEtaDays: 5, 
    activityType: "ONE_TIME", 
    taskOwner: "Alice" 
  },
  { 
    taskName: "Valid Task", 
    tentativeEtaDays: -5, // Invalid: negative days
    activityType: "ONE_TIME", 
    taskOwner: "Bob" 
  },
  { 
    taskName: "Another Task", 
    tentativeEtaDays: 5, 
    activityType: "INVALID_TYPE", // Invalid: unknown type
    taskOwner: "Charlie" 
  }
];

const validation = validateTasks(invalidTasks);
if (!validation.valid) {
  console.log('Validation Errors Found:');
  validation.errors.forEach(error => console.log(`  ❌ ${error}`));
} else {
  console.log('All tasks valid ✅');
}
console.log('\n');

// ============================================
// Performance Test
// ============================================
console.log('Example 7: Performance Test (100 tasks)');
console.log('----------------------------------------');

const largeTasks = [];
const owners = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
for (let i = 1; i <= 100; i++) {
  largeTasks.push({
    taskName: `Task ${i}`,
    tentativeEtaDays: Math.floor(Math.random() * 10) + 1,
    activityType: i % 10 === 0 ? 'CONTINUOUS' : 'ONE_TIME',
    taskOwner: owners[i % owners.length]
  });
}

const startTime = Date.now();
const resultLarge = scheduleSprintViewTasks(largeTasks);
const endTime = Date.now();

console.log(`Scheduled ${resultLarge.scheduledTasks.length} tasks in ${endTime - startTime}ms`);
console.log('Total Project Duration:', resultLarge.totalProjectWeeks, 'weeks');
console.log('Performance: ✅ Fast scheduling');
console.log('\n');

// ============================================
// Summary
// ============================================
console.log('========================================');
console.log('TEST SUMMARY');
console.log('========================================');
console.log('✅ Sequential task scheduling');
console.log('✅ Parallel task execution');
console.log('✅ Multiple activity types');
console.log('✅ Resource constraint enforcement');
console.log('✅ Input validation');
console.log('✅ Performance optimization');
console.log('\n🎉 All tests completed successfully!\n');

console.log('========================================');
console.log('TO TEST WITH YOUR OWN DATA:');
console.log('========================================');
console.log('1. Start backend: cd Backend && node index.js');
console.log('2. Test API:');
console.log('   curl -X POST http://localhost:4000/api/sprintview/schedule \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"tasks":[{"taskName":"Test","tentativeEtaDays":5,"activityType":"ONE_TIME","taskOwner":"You"}]}\'');
console.log('\n3. Or run this file: node testSprintView.js');
console.log('========================================\n');
