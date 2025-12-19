import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SprintViewChart from '../components/sprintview/SprintViewChart';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import { 
  calculateProjectStats, 
  exportSprintViewToCSV, 
  downloadCSV,
  sortTasksForSprintView 
} from '../utils/sprintviewConfig';
import api from '../services/api';

/**
 * SprintView View Page
 * Displays SprintView chart for a board's tasks
 */
const SprintViewView = () => {
  const { boardId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sprintviewData, setSprintViewData] = useState(null);
  const [boardInfo, setBoardInfo] = useState(null);
  const [expandRecurring, setExpandRecurring] = useState(false);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    loadSprintViewData();
  }, [boardId, expandRecurring]);

  const loadSprintViewData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/sprintview/schedule-from-board/${boardId}`, {
        expandRecurring
      });

      if (response.scheduledTasks && response.scheduledTasks.length > 0) {
        // Sort tasks for better visualization
        const sortedTasks = sortTasksForSprintView(response.scheduledTasks);
        setSprintViewData({
          ...response,
          scheduledTasks: sortedTasks
        });
      } else {
        setSprintViewData(response);
      }

      if (response.boardInfo) {
        setBoardInfo(response.boardInfo);
      }
    } catch (err) {
      console.error('Failed to load SprintView data:', err);
      setError(err.response?.data?.error || 'Failed to generate SprintView chart');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!sprintviewData || !sprintviewData.scheduledTasks) return;
    
    const csv = exportSprintViewToCSV(sprintviewData.scheduledTasks, sprintviewData.totalProjectWeeks);
    const filename = boardInfo 
      ? `${boardInfo.boardName}-sprintview-${new Date().toISOString().split('T')[0]}.csv`
      : 'sprintview-chart.csv';
    
    downloadCSV(csv, filename);
  };

  const handleRefresh = () => {
    loadSprintViewData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600">Generating SprintView chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading SprintView Chart</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleRefresh}>Try Again</Button>
            <Link to={`/board/${boardId}`}>
              <Button variant="secondary">Back to Board</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!sprintviewData || sprintviewData.scheduledTasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md text-center">
          <div className="text-gray-400 text-5xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Tasks to Display</h2>
          <p className="text-gray-600 mb-4">
            Add tasks to your board with estimated days and owners to generate a SprintView chart.
          </p>
          <Link to={`/board/${boardId}`}>
            <Button>Back to Board</Button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = calculateProjectStats(sprintviewData.scheduledTasks, sprintviewData.totalProjectWeeks);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to={`/board/${boardId}`}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Board
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {boardInfo?.boardName || 'Board'} - SprintView Chart
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Timeline view • {stats.totalTasks} tasks • {stats.totalWeeks} weeks
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                {showStats ? 'Hide' : 'Show'} Stats
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCSV}
              >
                📥 Export CSV
              </Button>
              <Button
                size="sm"
                onClick={handleRefresh}
              >
                🔄 Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Stats Panel */}
          {showStats && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard
                  label="Total Duration"
                  value={`${stats.totalWeeks} weeks`}
                  sublabel={`${stats.totalWorkingDays} working days`}
                  icon="📅"
                />
                <StatCard
                  label="Total Tasks"
                  value={stats.totalTasks}
                  sublabel={`${stats.owners} team members`}
                  icon="✅"
                />
                <StatCard
                  label="Longest Task"
                  value={stats.longestTask?.durationDays + ' days'}
                  sublabel={stats.longestTask?.taskName}
                  icon="⏱️"
                />
                <StatCard
                  label="Activity Types"
                  value={Object.keys(stats.activityTypes).length}
                  sublabel={Object.entries(stats.activityTypes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                  icon="🏷️"
                />
              </div>

              {/* Owner Timeline Summary */}
              {sprintviewData.ownerTimelines && Object.keys(sprintviewData.ownerTimelines).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Team Member Workload</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(sprintviewData.ownerTimelines).map(([owner, timeline]) => (
                      <div key={owner} className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-gray-900">{owner}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {timeline.totalTasks} tasks
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          Until day {timeline.lastAvailableDay - 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={expandRecurring}
                onChange={(e) => setExpandRecurring(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Expand recurring tasks</span>
            </label>
            <div className="text-xs text-gray-500">
              Show each weekly occurrence separately
            </div>
          </div>

          {/* SprintView Chart */}
          <SprintViewChart
            scheduledTasks={sprintviewData.scheduledTasks}
            totalProjectWeeks={sprintviewData.totalProjectWeeks}
            ownerTimelines={sprintviewData.ownerTimelines}
            showLegend={true}
            compact={false}
          />
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, sublabel, icon }) => (
  <div className="flex items-start gap-3">
    <div className="text-3xl">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
      {sublabel && (
        <div className="text-xs text-gray-500 mt-1 truncate" title={sublabel}>
          {sublabel}
        </div>
      )}
    </div>
  </div>
);

export default SprintViewView;
