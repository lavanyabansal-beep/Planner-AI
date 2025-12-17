import { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';

const AddTaskButton = ({ bucketId, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onAdd(bucketId, { title: title.trim() });
      setTitle('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-primary-400 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task name"
        autoFocus
        disabled={loading}
        className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !title.trim()} size="sm" className="flex-1">
          Add
        </Button>
        <Button type="button" onClick={handleCancel} variant="secondary" size="sm" disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default AddTaskButton;
