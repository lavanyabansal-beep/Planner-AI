import { useState, useEffect } from 'react';
import { boardsAPI } from '../services/api';
import BoardView from '../components/board/BoardView';
import TaskDetailsModal from '../components/task/TaskDetailsModal';
import AddMemberModal from '../components/members/AddMemberModal';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import useBoard from '../hooks/useBoard';

const Home = () => {
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);

  const {
    board,
    buckets,
    tasks,
    users,
    loading,
    error,
    createBucket,
    updateBucket,
    deleteBucket,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByBucket,
    refetch,
  } = useBoard(selectedBoardId);

  // Fetch all boards
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const data = await boardsAPI.getAll();
        setBoards(data);
        if (data.length > 0 && !selectedBoardId) {
          setSelectedBoardId(data[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch boards:', err);
      } finally {
        setLoadingBoards(false);
      }
    };

    fetchBoards();
  }, []);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleMemberAdded = () => {
    refetch();
  };

  if (loadingBoards) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-sm text-gray-300">Loading boards...</p>
        </div>
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">No boards yet</h2>
            <p className="text-gray-400">Create your first board to start organizing tasks</p>
          </div>
          <Button variant="primary" size="lg">
            Create Board
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">
      {/* Header */}
      <header className="bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 shadow-elevated sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left section */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Planner AI</h1>
              </div>
              
              {/* Board Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="board-selector" className="sr-only">Select Board</label>
                <select
                  id="board-selector"
                  value={selectedBoardId || ''}
                  onChange={(e) => setSelectedBoardId(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white rounded-lg px-4 py-2 min-w-[160px] max-w-[240px] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Select active board"
                >
                  {boards.map(b => (
                    <option key={b._id} value={b._id}>{b.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setShowAddMember(true)} 
                variant="secondary" 
                size="sm"
                ariaLabel="Add team member"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                }
              >
                <span className="hidden sm:inline">Add Member</span>
              </Button>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg border border-gray-600">
                <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-200">
                  {users.length} {users.length === 1 ? 'member' : 'members'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden" role="main">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <Spinner size="lg" />
              <p className="text-sm text-gray-300">Loading board...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center max-w-md space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-danger-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-danger-500/20">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
                <p className="text-sm text-gray-400 mb-4">{error}</p>
                <Button onClick={refetch} variant="primary">Try Again</Button>
              </div>
            </div>
          </div>
        ) : (
          <BoardView
            buckets={buckets}
            tasks={tasks}
            users={users}
            onCreateBucket={createBucket}
            onUpdateBucket={updateBucket}
            onDeleteBucket={deleteBucket}
            onCreateTask={createTask}
            onUpdateTask={updateTask}
            onMoveTask={moveTask}
            onTaskClick={handleTaskClick}
            getTasksByBucket={getTasksByBucket}
          />
        )}
      </main>

      {/* Modals */}
      <TaskDetailsModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        users={users}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />

      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onMemberAdded={handleMemberAdded}
      />
    </div>
  );
};

export default Home;
