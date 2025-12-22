import React, { useState } from 'react';
import SprintViewChart from './SprintViewChart';
import UserDaySprintView from './UserDaySprintView';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import { 
  calculateProjectStats, 
  exportSprintViewToCSV, 
  downloadCSV,
  sortTasksForSprintView 
} from '../../utils/sprintviewConfig';
import api from '../../services/api';

/**
 * SprintView Modal Component
 * Shows SprintView chart in a modal overlay
 * Supports member-specific filtering
 */
const SprintViewModal = ({ boardId, boardName, isOpen, onClose, selectedMemberId, selectedMemberName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sprintviewData, setSprintViewData] = useState(null);
  const [userDayData, setUserDayData] = useState(null);
  const [expandRecurring, setExpandRecurring] = useState(false);
  const [viewMode, setViewMode] = useState('task'); // 'task' or 'user-day'

  React.useEffect(() => {
    if (isOpen && boardId) {
      loadSprintViewData();
    }
  }, [isOpen, boardId, expandRecurring, selectedMemberId]);

  const loadSprintViewData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/api/sprintview/schedule-from-board/${boardId}`, {
        expandRecurring
      });

      const data = response.data;

      if (data.scheduledTasks && data.scheduledTasks.length > 0) {
        const sortedTasks = sortTasksForSprintView(data.scheduledTasks);
        
        // Filter by member if selected
        const filteredTasks = selectedMemberName
          ? sortedTasks.filter(task => task.taskOwner === selectedMemberName)
          : sortedTasks;

        setSprintViewData({
          ...data,
          scheduledTasks: filteredTasks
        });

        // Load user-day view with filtered tasks
        await loadUserDayView(filteredTasks, data.totalProjectWeeks);
      } else {
        setSprintViewData(data);
        setUserDayData(null);
      }
    } catch (err) {
      console.error('Failed to load SprintView data:', err);
      setError(err.response?.data?.error || 'Failed to generate SprintView chart');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDayView = async (scheduledTasks, totalProjectWeeks) => {
    try {
      const response = await api.post('/api/sprintview/user-day-view', {
        scheduledTasks,
        totalProjectWeeks,
        format: 'nested'
      });

      setUserDayData(response.data);
    } catch (err) {
      console.error('Failed to load user-day view:', err);
      // Don't set error - just fail silently for user-day view
      setUserDayData(null);
    }
  };

  const handleExportCSV = () => {
    if (!sprintviewData || !sprintviewData.scheduledTasks) return;
    
    const csv = exportSprintViewToCSV(sprintviewData.scheduledTasks, sprintviewData.totalProjectWeeks);
    const filename = boardName 
      ? `${boardName}-sprintview-${new Date().toISOString().split('T')[0]}.csv`
      : 'sprintview-chart.csv';
    
    downloadCSV(csv, filename);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SprintView Chart Timeline" size="full">
      <div className="space-y-4">
        {/* Member Filter Indicator */}
        {selectedMemberName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                Filtered by: <span className="font-bold">{selectedMemberName}</span>
              </span>
            </div>
            <span className="text-xs text-blue-600">
              Showing only tasks assigned to this member
            </span>
          </div>
        )}

        {/* Header Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('task')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'task'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Task View
              </button>
              <button
                onClick={() => setViewMode('user-day')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'user-day'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                User Day View
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={expandRecurring}
                onChange={(e) => setExpandRecurring(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Expand recurring tasks</span>
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              📥 Export CSV
            </Button>
            <Button size="sm" onClick={loadSprintViewData}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center">
            <Spinner />
            <p className="mt-4 text-gray-600">Generating SprintView chart...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading SprintView Chart</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadSprintViewData}>Try Again</Button>
          </div>
        ) : !sprintviewData || sprintviewData.scheduledTasks.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-gray-400 text-5xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks to Display</h3>
            <p className="text-gray-600">
              Add tasks with estimated days and owners to generate a SprintView chart.
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            {sprintviewData && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {sprintviewData.totalProjectWeeks}
                    </div>
                    <div className="text-xs text-gray-600">Weeks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {sprintviewData.scheduledTasks.length}
                    </div>
                    <div className="text-xs text-gray-600">Tasks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {Object.keys(sprintviewData.ownerTimelines || {}).length}
                    </div>
                    <div className="text-xs text-gray-600">Team Members</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {sprintviewData.totalProjectWeeks * 5}
                    </div>
                    <div className="text-xs text-gray-600">Working Days</div>
                  </div>
                </div>
              </div>
            )}

            {/* SprintView Charts */}
            <div className="overflow-x-auto">
              {viewMode === 'task' ? (
                <SprintViewChart
                  scheduledTasks={sprintviewData.scheduledTasks}
                  totalProjectWeeks={sprintviewData.totalProjectWeeks}
                  ownerTimelines={sprintviewData.ownerTimelines}
                  showLegend={true}
                  compact={false}
                />
              ) : viewMode === 'user-day' && userDayData ? (
                <UserDaySprintView
                  userDayData={userDayData}
                  showStats={true}
                  compact={false}
                />
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Spinner />
                  <p className="mt-2">Loading user-day view...</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default SprintViewModal;
