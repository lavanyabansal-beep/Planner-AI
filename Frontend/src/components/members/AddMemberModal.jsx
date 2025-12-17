import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { usersAPI } from '../../services/api';
import { getInitials, getAvatarColor } from '../../utils/helpers';

const AddMemberModal = ({ isOpen, onClose, onMemberAdded }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const initials = getInitials(name);
      const avatarColor = getAvatarColor(Math.floor(Math.random() * 10));
      
      const newUser = await usersAPI.create({
        name: name.trim(),
        email: email.trim() || undefined,
        initials,
        avatarColor,
      });

      onMemberAdded(newUser);
      setName('');
      setEmail('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member" size="sm">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-danger-500/20 text-danger-300 rounded-lg text-sm border border-danger-500/30">
            {error}
          </div>
        )}

        <div>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            disabled={loading}
            required
            className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
          />
        </div>

        <div>
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            disabled={loading}
            className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
            {loading ? 'Adding...' : 'Add Member'}
          </Button>
          <Button type="button" onClick={onClose} variant="secondary" disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMemberModal;
