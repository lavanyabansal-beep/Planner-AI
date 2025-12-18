import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import MemberPicker from '../members/MemberPicker';
import AvatarGroup from '../common/AvatarGroup';
import { uploadsAPI } from '../../services/api';
import { getProgressLabel, getProgressColor } from '../../utils/helpers';

const TaskDetailsModal = ({ isOpen, onClose, task, users, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: [],
    priority: 'medium',
    progress: 'not_started',
    startDate: '',
    dueDate: '',
    checklist: [],
    attachments: [],
    completed: false,
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (task) {
      // Populate assigned users with full user objects
      const populatedAssignedTo = (task.assignedTo || []).map(userId => {
        if (typeof userId === 'string') {
          return users.find(u => u._id === userId) || { _id: userId, name: 'Unknown' };
        }
        return userId;
      }).filter(Boolean);

      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: populatedAssignedTo,
        priority: task.priority || 'medium',
        progress: task.progress || 'not_started',
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        checklist: task.checklist || [],
        attachments: task.attachments || [],
        completed: task.completed || false,
      });
    }
  }, [task, users]);

  const handleSave = async () => {
    try {
      await onUpdate(task._id, {
        ...formData,
        assignedTo: formData.assignedTo.map(u => u._id),
        startDate: formData.startDate || undefined,
        dueDate: formData.dueDate || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this task?')) {
      try {
        await onDelete(task._id);
        onClose();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    setFormData({
      ...formData,
      checklist: [...formData.checklist, { text: newChecklistItem.trim(), done: false }],
    });
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (index) => {
    const updated = [...formData.checklist];
    updated[index].done = !updated[index].done;
    setFormData({ ...formData, checklist: updated });
  };

  const removeChecklistItem = (index) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((_, i) => i !== index),
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadedFile = await uploadsAPI.upload(file);
      setFormData({
        ...formData,
        attachments: [...formData.attachments, uploadedFile],
      });
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index),
    });
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="lg">
      <div className="p-6 space-y-6">
        {/* Title */}
        <div>
          <Input
            label="Task Name"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter task name"
            required
            className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Description */}
        <div>
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Add a detailed description..."
            rows={4}
            maxLength={500}
            className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Assigned Members */}
        <div>
          <label className="form-label">Assigned To</label>
          <div className="flex items-center gap-3">
            <MemberPicker
              users={users}
              selectedUsers={formData.assignedTo}
              onChange={(selected) => setFormData({ ...formData, assignedTo: selected })}
            />
            {formData.assignedTo.length > 0 && (
              <div className="flex-1">
                <AvatarGroup users={formData.assignedTo} max={6} />
              </div>
            )}
          </div>
        </div>

        {/* Priority & Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="priority" className="form-label">Priority</label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="form-select"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label htmlFor="progress" className="form-label">Progress</label>
            <select
              id="progress"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
              className="form-select"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Start Date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="bg-gray-900 border-gray-600 text-white"
          />
          <Input
            type="date"
            label="Due Date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="bg-gray-900 border-gray-600 text-white"
          />
        </div>

        {/* Checklist */}
        <div>
          <label className="form-label">Checklist</label>
          <div className="space-y-2">
            {formData.checklist.map((item, index) => (
              <div key={index} className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg hover:bg-gray-900/70 transition-colors group border border-gray-700">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleChecklistItem(index)}
                  className="w-4 h-4 text-primary-600 bg-gray-800 border-gray-600 rounded focus:ring-primary-500 cursor-pointer"
                  aria-label={`Mark "${item.text}" as ${item.done ? 'incomplete' : 'complete'}`}
                />
                <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                  {item.text}
                </span>
                <button
                  type="button"
                  onClick={() => removeChecklistItem(index)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-danger-400 transition-all p-1 rounded hover:bg-gray-800"
                  aria-label={`Remove "${item.text}" from checklist`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {formData.checklist.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No checklist items yet</p>
            )}
            <form onSubmit={handleAddChecklistItem} className="flex gap-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Add checklist item"
                className="flex-1 bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
                ariaLabel="New checklist item"
              />
              <Button
                  type="submit"
                  size="sm"
                  disabled={!newChecklistItem.trim()}
                  className="rounded-full w-10 h-10 flex items-center justify-center"
                >

                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Button>
            </form>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="form-label">Attachments</label>
          <div className="space-y-3">
            {formData.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg hover:bg-gray-900/70 transition-colors group border border-gray-700">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center border border-primary-500/30">
                    <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-200 truncate">{attachment.name}</div>
                    <div className="text-xs text-gray-500">{attachment.size}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-primary-500/10 transition-colors"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-gray-500 hover:text-danger-400 p-1.5 rounded-lg hover:bg-gray-800 transition-all"
                    aria-label={`Remove ${attachment.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {formData.attachments.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No attachments yet</p>
            )}
            <label className="block">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-500/5 transition-all group">
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-400">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-800 group-hover:bg-primary-500/10 rounded-xl flex items-center justify-center transition-colors border border-gray-700 group-hover:border-primary-500/30">
                      <svg className="w-6 h-6 text-gray-500 group-hover:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-300 group-hover:text-primary-400 transition-colors">Click to upload</span>
                      <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-700">
          <Button
              onClick={handleDelete}
              variant="danger"
              fullWidth
              className="sm:w-auto rounded-full px-6"
            >

            Delete Task
          </Button>
          <div className="flex gap-3">
            <Button
                onClick={onClose}
                variant="secondary" 
                fullWidth
                className="sm:w-auto flex-1 sm:flex-initial rounded-full px-6"
              >
git
              Cancel
            </Button>
            <Button
                onClick={handleSave}
                variant="primary"
                fullWidth
                className="sm:w-auto flex-1 sm:flex-initial rounded-full px-6"
              >

              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailsModal;
