import React, { useState, useMemo } from 'react';
import { ACTIVITY_TYPE_CONFIG } from '../../utils/sprintviewConfig';

/**
 * User-Day SprintView Chart
 * 
 * Per-User, Day-Level Workload Visualization
 * 
 * Design Principles:
 * - Rows = Users (not tasks)
 * - Columns = Individual working days
 * - Only highlight days where task is active
 * - Empty days clearly visible
 * - Overload detection (multiple tasks per day)
 * 
 * Team Lead Questions Answered:
 * - Who is working on what?
 * - On which exact days?
 * - Who has capacity?
 * - Where are the bottlenecks?
 */
const UserDaySprintView = ({ 
  userDayData, 
  showStats = true,
  compact = false 
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  if (!userDayData || !userDayData.users || userDayData.users.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-400 text-lg">No user day data available</div>
        <div className="text-gray-500 text-sm mt-2">Schedule tasks to generate user-day view</div>
      </div>
    );
  }

  const { users, weekGrid, totalWeeks, totalDays, metadata } = userDayData;

  // Filter out free days (days with no tasks across all users)
  const { filteredWeekGrid, filteredTotalDays, occupiedDaysSet } = useMemo(() => {
    // Build set of days that have at least one task across all users
    const occupiedDays = new Set();
    
    users.forEach(user => {
      user.weeks.forEach(week => {
        week.days.forEach(day => {
          if (!day.isEmpty) {
            occupiedDays.add(day.absoluteDay);
          }
        });
      });
    });

    // Filter weekGrid to only include occupied days
    const newWeekGrid = weekGrid.map(week => {
      const filteredDays = week.days.filter(day => occupiedDays.has(day.absoluteDay));
      return {
        ...week,
        days: filteredDays
      };
    }).filter(week => week.days.length > 0); // Remove weeks with no occupied days

    const newTotalDays = Array.from(occupiedDays).length;

    return {
      filteredWeekGrid: newWeekGrid,
      filteredTotalDays: newTotalDays,
      occupiedDaysSet: occupiedDays
    };
  }, [users, weekGrid]);

  // Calculate team-level statistics
  const teamStats = useMemo(() => {
    const overloadedUsers = users.filter(u => u.stats.hasOverload);

    return {
      overloadedCount: overloadedUsers.length
    };
  }, [users]);

  // Render a single day cell
  const renderDayCell = (user, week, day, weekIdx, dayIdx) => {
    const cellId = `${user.userName}-w${week.weekNumber}-d${day.dayInWeek}`;
    const isHovered = hoveredCell === cellId;
    const isEmpty = day.isEmpty;
    const isOverloaded = day.tasks.length > 1;

    // Determine background color
    let bgColorClass = 'bg-gray-50';
    let borderClass = 'border-gray-200';
    
    if (!isEmpty) {
      if (isOverloaded) {
        bgColorClass = 'bg-red-100 border-red-300';
        borderClass = 'border-red-300';
      } else {
        const task = day.tasks[0];
        const config = ACTIVITY_TYPE_CONFIG[task.activityType] || ACTIVITY_TYPE_CONFIG.ONE_TIME;
        bgColorClass = ''; // Custom background
      }
    }

    return (
      <div
        key={cellId}
        className={`relative border-l border-b ${borderClass} transition-all ${
          isHovered ? 'ring-2 ring-blue-400 z-20' : ''
        } ${isEmpty ? bgColorClass : ''}`}
        style={{
          minHeight: compact ? '36px' : '48px',
          backgroundColor: !isEmpty && !isOverloaded 
            ? ACTIVITY_TYPE_CONFIG[day.tasks[0].activityType]?.color + '20' // 20 = alpha
            : undefined
        }}
        onMouseEnter={() => setHoveredCell(cellId)}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {/* Task indicators */}
        {!isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            {isOverloaded ? (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-red-600 font-bold text-xs">{day.tasks.length}</span>
                <div className="flex gap-0.5">
                  {day.tasks.slice(0, 3).map((task, idx) => (
                    <div
                      key={idx}
                      className="w-1.5 h-3 rounded-sm"
                      style={{ 
                        backgroundColor: ACTIVITY_TYPE_CONFIG[task.activityType]?.color || '#3b82f6' 
                      }}
                    />
                  ))}
                  {day.tasks.length > 3 && (
                    <span className="text-xs text-gray-600">+</span>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: ACTIVITY_TYPE_CONFIG[day.tasks[0].activityType]?.color || '#3b82f6' 
                }}
              />
            )}
          </div>
        )}

        {/* Hover tooltip */}
        {isHovered && !isEmpty && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none max-w-xs">
            <div className="font-semibold mb-1">
              {day.dayName}, Day {day.absoluteDay}
            </div>
            {day.tasks.map((task, idx) => (
              <div key={idx} className="text-gray-200 mt-1 border-t border-gray-700 pt-1">
                <div className="font-medium">{task.taskName}</div>
                <div className="text-gray-400 text-xs">
                  {task.activityType.replace(/_/g, ' ')} • {task.durationDays}d
                </div>
              </div>
            ))}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  };

  // Render user row
  const renderUserRow = (user) => {
    const isExpanded = expandedUser === user.userName;

    return (
      <div key={user.userName} className="border-b border-gray-200">
        {/* User info column */}
        <div className="grid" style={{
          gridTemplateColumns: compact ? '180px 1fr' : '250px 1fr'
        }}>
          {/* Left: User info */}
          <div className="border-r border-gray-200 bg-gray-50 px-4 py-3 sticky left-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate" title={user.userName}>
                  {user.userName}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {user.totalTasks} tasks
                </div>
                {user.stats.hasOverload && (
                  <div className="text-xs text-red-600 font-medium mt-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Overloaded
                  </div>
                )}
              </div>
              <button
                onClick={() => setExpandedUser(isExpanded ? null : user.userName)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Expanded stats */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Occupied:</span>
                  <span className="font-medium text-gray-900">{user.stats.occupiedDays}d</span>
                </div>
                {user.stats.overlappingDays > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Overlaps:</span>
                    <span className="font-medium text-red-600">{user.stats.overlappingDays}d</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Day grid */}
          <div className="grid" style={{
            gridTemplateColumns: `repeat(${filteredTotalDays}, minmax(${compact ? '28px' : '36px'}, 1fr))`
          }}>
            {user.weeks.flatMap((week, weekIdx) =>
              week.days
                .filter(day => occupiedDaysSet.has(day.absoluteDay))
                .map((day, dayIdx) =>
                  renderDayCell(user, week, day, weekIdx, dayIdx)
                )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">User Day View</h2>
            <div className="text-sm text-gray-600 mt-1">
              {users.length} users • {filteredWeekGrid.length} weeks • {filteredTotalDays} occupied days
            </div>
          </div>
          {showStats && teamStats.overloadedCount > 0 && (
            <div className="flex gap-4 text-xs">
              <div className="text-right">
                <div className="text-gray-500">Overloaded</div>
                <div className="font-semibold text-red-600">{teamStats.overloadedCount} users</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Header - Weeks and Days */}
      <div className="grid border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white" style={{
        gridTemplateColumns: compact ? '180px 1fr' : '250px 1fr'
      }}>
        <div className="border-r border-gray-200 px-4 py-2 sticky left-0 z-10 bg-gray-50">
          <div className="text-xs font-semibold text-gray-700">Team Member</div>
        </div>

        {/* Week/Day headers */}
        <div>
          {/* Week row */}
          <div className="grid border-b border-gray-200" style={{
            gridTemplateColumns: `repeat(${filteredTotalDays}, minmax(${compact ? '28px' : '36px'}, 1fr))`
          }}>
            {filteredWeekGrid.map(week => (
              <div
                key={week.weekNumber}
                className="border-l border-gray-300 px-2 py-1 text-center bg-gray-100"
                style={{
                  gridColumn: `span ${week.days.length}`
                }}
              >
                <div className="text-xs font-bold text-gray-800">Week {week.weekNumber}</div>
                <div className="text-xs text-gray-500">{week.days.length} days</div>
              </div>
            ))}
          </div>

          {/* Day row */}
          <div className="grid" style={{
            gridTemplateColumns: `repeat(${filteredTotalDays}, minmax(${compact ? '28px' : '36px'}, 1fr))`
          }}>
            {filteredWeekGrid.flatMap(week =>
              week.days.map(day => (
                <div
                  key={day.absoluteDay}
                  className={`border-l text-center py-1 ${
                    day.dayInWeek === 1 ? 'border-gray-300' : 'border-gray-200'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-700">{day.dayName}</div>
                  <div className="text-xs text-gray-400">{day.absoluteDay}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Rows */}
      <div className="overflow-x-auto overflow-y-visible">
        <div className={compact ? 'min-w-[1000px]' : 'min-w-[1400px]'}>
          {users.map(renderUserRow)}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-gray-50 border border-gray-200 rounded"></div>
              <span className="text-gray-600">Empty (available)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-blue-100 rounded flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>
              <span className="text-gray-600">Occupied (1 task)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-red-100 border border-red-300 rounded flex items-center justify-center">
                <span className="text-red-600 font-bold text-xs">2+</span>
              </div>
              <span className="text-gray-600">Overloaded (multiple tasks)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="text-gray-500">Activity Types:</div>
            {Object.entries(ACTIVITY_TYPE_CONFIG).slice(0, 4).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-gray-600">{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDaySprintView;
