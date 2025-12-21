import React, { useState, useMemo } from 'react';
import { ACTIVITY_TYPE_CONFIG } from '../../utils/sprintviewConfig';

/**
 * Enterprise-Grade SprintView Chart Component
 * Implements standard SprintView chart visualization with:
 * - Time-scaled horizontal bars
 * - Week-based timeline
 * - Activity type differentiation
 * - Resource-aware layout
 */
const SprintViewChart = ({ 
  scheduledTasks = [], 
  totalProjectWeeks = 0,
  ownerTimelines = {},
  showLegend = true,
  compact = false 
}) => {
  const [hoveredTask, setHoveredTask] = useState(null);

  // Generate week columns
  const weeks = useMemo(() => {
    return Array.from({ length: totalProjectWeeks }, (_, i) => i + 1);
  }, [totalProjectWeeks]);

  // Transform data: Group tasks by taskId to prevent duplication
  const transformedTasks = useMemo(() => {
    const taskMap = new Map();

    scheduledTasks.forEach(scheduledTask => {
      const taskId = scheduledTask.taskId || scheduledTask.taskName;
      
      if (!taskMap.has(taskId)) {
        // Create parent task entry
        taskMap.set(taskId, {
          taskId,
          taskName: scheduledTask.taskName,
          activityType: scheduledTask.activityType,
          totalEstimatedDays: scheduledTask.durationDays,
          startWeek: scheduledTask.startWeek,
          endWeek: scheduledTask.endWeek,
          members: []
        });
      }

      const taskEntry = taskMap.get(taskId);
      
      // Add member to this task
      taskEntry.members.push({
        memberId: scheduledTask.taskOwner,
        memberName: scheduledTask.taskOwner,
        assignedDays: scheduledTask.durationDays / (scheduledTask.allOwners?.length || 1),
        startWeek: scheduledTask.startWeek,
        endWeek: scheduledTask.endWeek,
        durationDays: scheduledTask.durationDays
      });
    });

    return Array.from(taskMap.values());
  }, [scheduledTasks]);

  // Group tasks by owner for better visualization
  const tasksByOwner = useMemo(() => {
    const grouped = {};
    scheduledTasks.forEach(task => {
      if (!grouped[task.taskOwner]) {
        grouped[task.taskOwner] = [];
      }
      grouped[task.taskOwner].push(task);
    });
    return grouped;
  }, [scheduledTasks]);

  // Calculate bar position and width
  const calculateBarStyle = (task) => {
    const { startWeek, endWeek, activityType } = task;
    const totalWeeks = weeks.length;
    
    if (totalWeeks === 0) return { display: 'none' };

    const startPercent = ((startWeek - 1) / totalWeeks) * 100;
    const widthPercent = ((endWeek - startWeek + 1) / totalWeeks) * 100;

    const config = ACTIVITY_TYPE_CONFIG[activityType] || ACTIVITY_TYPE_CONFIG.ONE_TIME;

    return {
      left: `${startPercent}%`,
      width: activityType === 'MILESTONE' ? '8px' : `${widthPercent}%`,
      minWidth: activityType === 'MILESTONE' ? '8px' : '4px',
      backgroundColor: config.color,
      borderStyle: config.borderStyle,
      borderWidth: config.borderStyle === 'dashed' ? '2px' : '0',
      borderColor: config.color,
      opacity: config.opacity,
    };
  };

  // Calculate bar position and width for members
  const calculateMemberBarStyle = (member) => {
    const { startWeek, endWeek } = member;
    const totalWeeks = weeks.length;
    
    if (totalWeeks === 0) return { display: 'none' };

    const startPercent = ((startWeek - 1) / totalWeeks) * 100;
    const widthPercent = ((endWeek - startWeek + 1) / totalWeeks) * 100;

    return {
      left: `${startPercent}%`,
      width: `${widthPercent}%`,
      minWidth: '4px'
    };
  };

  // Render member bar (child row)
  const renderMemberBar = (member, task, memberIndex) => {
    const config = ACTIVITY_TYPE_CONFIG[task.activityType] || ACTIVITY_TYPE_CONFIG.ONE_TIME;
    const barStyle = calculateMemberBarStyle(member);
    const isHovered = hoveredTask === `${task.taskId}-member-${memberIndex}`;

    return (
      <div
        key={`member-${memberIndex}`}
        className={`absolute top-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
          isHovered ? 'z-20 scale-105' : 'z-10'
        } ${config.className}`}
        style={{
          ...barStyle,
          backgroundColor: config.color,
          borderStyle: config.borderStyle,
          borderWidth: config.borderStyle === 'dashed' ? '2px' : '0',
          borderColor: config.color,
          opacity: config.opacity,
        }}
        onMouseEnter={() => setHoveredTask(`${task.taskId}-member-${memberIndex}`)}
        onMouseLeave={() => setHoveredTask(null)}
      >
        {/* Tooltip */}
        {isHovered && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
            <div className="font-semibold">{task.taskName}</div>
            <div className="text-gray-300 mt-1">
              <div>Member: {member.memberName}</div>
              <div>Assigned: {member.assignedDays.toFixed(1)} days</div>
              <div>Duration: {member.durationDays} days</div>
              <div>Week {member.startWeek} - {member.endWeek}</div>
              <div className="capitalize">{task.activityType.replace(/_/g, ' ')}</div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}

        {/* Member label */}
        <div className="px-2 text-xs font-medium truncate text-white">
          {member.memberName}
        </div>
      </div>
    );
  };

  // Render task bar
  const renderTaskBar = (task, index) => {
    const config = ACTIVITY_TYPE_CONFIG[task.activityType] || ACTIVITY_TYPE_CONFIG.ONE_TIME;
    const barStyle = calculateBarStyle(task);
    const isHovered = hoveredTask === `${task.taskOwner}-${index}`;

    return (
      <div
        key={`${task.taskOwner}-${index}`}
        className={`absolute top-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
          isHovered ? 'z-20 scale-105' : 'z-10'
        } ${config.className}`}
        style={barStyle}
        onMouseEnter={() => setHoveredTask(`${task.taskOwner}-${index}`)}
        onMouseLeave={() => setHoveredTask(null)}
      >
        {/* Tooltip */}
        {isHovered && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
            <div className="font-semibold">{task.taskName}</div>
            <div className="text-gray-300 mt-1">
              <div>Owner: {task.taskOwner}</div>
              <div>Duration: {task.durationDays} days</div>
              <div>Week {task.startWeek} - {task.endWeek}</div>
              <div>Day {task.startDay} - {task.endDay}</div>
              <div className="capitalize">{task.activityType.replace(/_/g, ' ')}</div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}

        {/* Task label (if space allows) */}
        {task.activityType !== 'MILESTONE' && (
          <div className="px-2 text-xs font-medium truncate text-white">
            {task.taskName}
          </div>
        )}
      </div>
    );
  };

  if (scheduledTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-400 text-lg">No tasks scheduled</div>
        <div className="text-gray-500 text-sm mt-2">Add tasks to generate SprintView chart</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Project SprintView Chart</h2>
            <div className="text-sm text-gray-600 mt-1">
              {transformedTasks.length} unique tasks • {scheduledTasks.length} assignments • {totalProjectWeeks} weeks • {Object.keys(tasksByOwner).length} team members
            </div>
          </div>
          {showLegend && <Legend />}
        </div>
      </div>

      {/* SprintView Grid */}
      <div className="overflow-x-auto">
        <div className={`${compact ? 'min-w-[800px]' : 'min-w-[1200px]'}`}>
          {/* Timeline Header */}
          <div className="grid gap-0 border-b border-gray-200 bg-gray-50" style={{
            gridTemplateColumns: compact ? '200px 1fr' : '300px 1fr'
          }}>
            {/* Task Info Header */}
            <div className="grid grid-cols-3 gap-2 px-4 py-3 border-r border-gray-200 font-semibold text-xs text-gray-700">
              <div>Task / Owner</div>
              <div>Duration</div>
              <div>Type</div>
            </div>

            {/* Week Headers */}
            <div className="grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(60px, 1fr))` }}>
              {weeks.map(week => (
                <div
                  key={week}
                  className="border-l border-gray-200 px-2 py-3 text-center text-xs font-semibold text-gray-700"
                >
                  Week {week}
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-gray-100">
            {transformedTasks.map((task, taskIndex) => (
              <React.Fragment key={task.taskId}>
                {/* Parent Task Row */}
                <div
                  className="grid gap-0 bg-gray-50 border-b-2 border-gray-300"
                  style={{
                    gridTemplateColumns: compact ? '200px 1fr' : '300px 1fr'
                  }}
                >
                  {/* Task Info */}
                  <div className="grid grid-cols-3 gap-2 px-4 py-3 border-r border-gray-200 bg-gray-100">
                    <div className="text-sm">
                      <div className="font-bold text-gray-900 truncate" title={task.taskName}>
                        📋 {task.taskName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {task.members.length} member{task.members.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      {task.totalEstimatedDays}d total
                    </div>
                    <div className="text-xs text-gray-600 truncate capitalize font-medium">
                      {task.activityType.replace(/_/g, ' ')}
                    </div>
                  </div>

                  {/* Empty Timeline (parent row is just for grouping) */}
                  <div 
                    className="relative grid bg-gray-100" 
                    style={{ 
                      gridTemplateColumns: `repeat(${weeks.length}, minmax(60px, 1fr))`,
                      minHeight: '40px'
                    }}
                  >
                    {/* Week columns (visual grid) */}
                    {weeks.map(week => (
                      <div
                        key={week}
                        className="border-l border-gray-300"
                      />
                    ))}
                  </div>
                </div>

                {/* Child Member Rows */}
                {task.members.map((member, memberIndex) => (
                  <div
                    key={`${task.taskId}-member-${memberIndex}`}
                    className="grid gap-0 hover:bg-blue-50 transition-colors pl-6"
                    style={{
                      gridTemplateColumns: compact ? '200px 1fr' : '300px 1fr'
                    }}
                  >
                    {/* Member Info */}
                    <div className="grid grid-cols-3 gap-2 px-4 py-3 border-r border-gray-200">
                      <div className="text-sm">
                        <div className="font-medium text-gray-700 truncate flex items-center gap-1" title={member.memberName}>
                          <span className="text-gray-400">└─</span>
                          <span>👤 {member.memberName}</span>
                        </div>
                      </div>
                      <div className="text-sm text-blue-600">
                        {member.assignedDays.toFixed(1)}d
                      </div>
                      <div className="text-xs text-gray-400">
                        {member.durationDays}d duration
                      </div>
                    </div>

                    {/* Timeline Grid */}
                    <div 
                      className="relative grid" 
                      style={{ 
                        gridTemplateColumns: `repeat(${weeks.length}, minmax(60px, 1fr))`,
                        minHeight: compact ? '48px' : '60px'
                      }}
                    >
                      {/* Week columns (visual grid) */}
                      {weeks.map(week => (
                        <div
                          key={week}
                          className="border-l border-gray-100"
                        />
                      ))}

                      {/* Member Task Bar */}
                      {renderMemberBar(member, task, memberIndex)}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex gap-6 text-xs text-gray-600">
          <div>
            <span className="font-semibold">Unique Tasks:</span> {transformedTasks.length}
          </div>
          <div>
            <span className="font-semibold">Total Assignments:</span> {scheduledTasks.length}
          </div>
          <div>
            <span className="font-semibold">Total Duration:</span> {Math.ceil(totalProjectWeeks * 5 / 7)} weeks
          </div>
          <div>
            <span className="font-semibold">Working Days:</span> {totalProjectWeeks * 5} days
          </div>
        </div>
      </div>
    </div>
  );
};

// Legend Component
const Legend = () => {
  const items = [
    { type: 'ONE_TIME', label: 'One-Time' },
    { type: 'CONTINUOUS', label: 'Continuous' },
    { type: 'API_1_DAY', label: 'API' },
    { type: 'RECURRING_WEEKLY', label: 'Recurring' },
    { type: 'MILESTONE', label: 'Milestone' },
    { type: 'BUFFER', label: 'Buffer' },
    { type: 'PARALLEL_ALLOWED', label: 'Parallel' },
  ];

  return (
    <div className="flex gap-3 flex-wrap">
      {items.map(item => {
        const config = ACTIVITY_TYPE_CONFIG[item.type];
        return (
          <div key={item.type} className="flex items-center gap-1.5">
            <div
              className="w-6 h-3 rounded-sm"
              style={{
                backgroundColor: config.color,
                borderStyle: config.borderStyle,
                borderWidth: config.borderStyle === 'dashed' ? '1px' : '0',
                borderColor: config.color,
                opacity: config.opacity
              }}
            />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default SprintViewChart;
