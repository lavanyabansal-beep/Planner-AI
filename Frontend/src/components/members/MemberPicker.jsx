import { useState } from 'react';
import Avatar from '../common/Avatar';

const MemberPicker = ({ users, selectedUsers = [], onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleUser = (user) => {
    const isSelected = selectedUsers.some(u => u._id === user._id);
    if (isSelected) {
      onChange(selectedUsers.filter(u => u._id !== user._id));
    } else {
      onChange([...selectedUsers, user]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        {selectedUsers.length > 0 ? `${selectedUsers.length} assigned` : 'Assign members'}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-72 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 z-20 max-h-80 overflow-y-auto">
            <div className="p-2">
              {users.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No team members available
                </div>
              ) : (
                users.map(user => {
                  const isSelected = selectedUsers.some(u => u._id === user._id);
                  return (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => toggleUser(user)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors ${isSelected ? 'bg-primary-500/20 border border-primary-500/30' : ''}`}
                    >
                      <Avatar user={user} size="md" />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-200">{user.name}</div>
                        {user.email && (
                          <div className="text-xs text-gray-500">{user.email}</div>
                        )}
                      </div>
                      {isSelected && (
                        <svg className="w-5 h-5 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MemberPicker;
