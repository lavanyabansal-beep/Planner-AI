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
              {scheduledTasks.length} tasks • {totalProjectWeeks} weeks • {Object.keys(tasksByOwner).length} team members
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
            {scheduledTasks.map((task, index) => (
              <div
                key={index}
                className="grid gap-0 hover:bg-blue-50 transition-colors"
                style={{
                  gridTemplateColumns: compact ? '200px 1fr' : '300px 1fr'
                }}
              >
                {/* Task Info */}
                <div className="grid grid-cols-3 gap-2 px-4 py-3 border-r border-gray-200">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 truncate" title={task.taskName}>
                      {task.taskName}
                    </div>
                    <div className="text-xs text-gray-500">{task.taskOwner}</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {task.durationDays}d
                  </div>
                  <div className="text-xs text-gray-500 truncate capitalize">
                    {task.activityType.replace(/_/g, ' ')}
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

                  {/* Task Bar */}
                  {renderTaskBar(task, index)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex gap-6 text-xs text-gray-600">
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
