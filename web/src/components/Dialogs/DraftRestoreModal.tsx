import React from 'react';
import { X, Clock, FileText } from 'lucide-react';

interface DraftRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
  onDiscard: () => void;
  timestamp: number;
}

const DraftRestoreModal: React.FC<DraftRestoreModalProps> = ({
  isOpen,
  onClose,
  onRestore,
  onDiscard,
  timestamp
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-primary px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Draft Found</h3>
                <p className="text-blue-100 text-sm">Previous work detected</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 p-4 bg-blue-50 rounded-lg">
            <Clock size={18} className="text-blue-600" />
            <div>
              <p className="text-gray-800 font-medium">Last saved:</p>
              <p className="text-blue-600 text-sm">{formatDate(timestamp)}</p>
            </div>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">
            We found a previously saved draft of your course. Would you like to restore it and continue 
            where you left off, or start fresh?
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDiscard}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Start Fresh
            </button>

            <button
              onClick={onRestore}
              className="flex-1 bg-[#4d81d2] hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              Restore Draft
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Your draft will be automatically saved as you work
          </p>
        </div>
      </div>
    </div>
  );
};

export default DraftRestoreModal;
