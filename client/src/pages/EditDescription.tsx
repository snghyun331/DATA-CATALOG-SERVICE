import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Edit3 } from 'lucide-react';

interface EditableDescriptionProps {
  value: string;
  onSave: (newValue: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const EditableDescription: React.FC<EditableDescriptionProps> = ({
  value,
  onSave,
  isLoading = false,
  placeholder = 'No description',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const trimmedValue = editValue.trim();

    if (trimmedValue !== value) {
      onSave(trimmedValue);
    }

    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(e as any);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel(e as any);
    }
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2 min-w-0 p-2 bg-blue-50 border-2 border-blue-300 rounded">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          className="flex-1 px-2 py-1 text-sm border-0 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
          placeholder="Enter description..."
          disabled={isLoading}
        />
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex-shrink-0 p-1 text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded transition-colors"
          title="Save"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="flex-shrink-0 p-1 text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center space-x-2 group min-w-0 px-2 py-1 rounded border-2 border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer"
      onClick={handleStartEdit}
    >
      <span className={`text-sm truncate flex-1 ${value ? 'text-gray-700' : 'text-gray-400 italic'}`}>
        {value || 'description을 입력해주세요'}
      </span>
      <Edit3 className="flex-shrink-0 w-3 h-3 text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
    </div>
  );
};

export default EditableDescription;
