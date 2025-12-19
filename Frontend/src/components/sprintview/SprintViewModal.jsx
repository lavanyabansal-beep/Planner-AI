import React, { useState } from 'react';
import SprintViewChart from './SprintViewChart';
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
 */
const SprintViewModal = ({ boardId, boardName, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sprintviewData, setSprintViewData] = useState(null);
  const [expandRecurring, setExpandRecurring] = useState(false);

  React.useEffect(() => {
    if (isOpen && boardId) {
      loadSprintViewData();
    }
  }, [isOpen, boardId, expandRecurring]);

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
        setSprintViewData({
          ...data,
          scheduledTasks: sortedTasks
        });
      } else {
        setSprintViewData(data);
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
    const filename = boardName 
      ? `${boardName}-sprintview-${new Date().toISOString().split('T')[0]}.csv`
      : 'sprintview-chart.csv';
    
    downloadCSV(csv, filename);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SprintView Chart Timeline" size="full">
      <div className="space-y-4">
        {/* Header Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
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

            {/* SprintView Chart */}
            <div className="overflow-x-auto">
              <SprintViewChart
                scheduledTasks={sprintviewData.scheduledTasks}
                totalProjectWeeks={sprintviewData.totalProjectWeeks}
                ownerTimelines={sprintviewData.ownerTimelines}
                showLegend={true}
                compact={false}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default SprintViewModal;
