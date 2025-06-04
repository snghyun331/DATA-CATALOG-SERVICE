import React, { useState } from 'react';
import { X, ChevronDown, Plus, Minus, Edit } from 'lucide-react';

interface DiffData {
  changed: boolean;
  tables: {
    changed: boolean;
    added: Array<{ table: string }>;
    deleted: Array<{ table: string }>;
  };
  columns: {
    changed: boolean;
    added: Array<{ table: string }>;
    deleted: Array<{ table: string }>;
    updated: Array<{ table: string }>;
  };
}

interface DatabaseDiffProps {
  isVisible: boolean;
  diffData: DiffData;
  onUpdate?: () => void; // 선택사항으로 변경
  onDismiss: () => void;
  isUpdating?: boolean;
}

const DatabaseDiff: React.FC<DatabaseDiffProps> = ({
  isVisible,
  diffData,
  onUpdate,
  onDismiss,
  isUpdating = false,
}) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  // 변경사항이 없거나 표시하지 않는 경우
  if (!isVisible || !diffData.changed) {
    return null;
  }

  // const handleUpdate = () => {
  //   onUpdate();
  //   setIsTooltipOpen(false);
  // };

  return (
    <div className="relative ml-4">
      <button
        onClick={() => setIsTooltipOpen(!isTooltipOpen)}
        className="flex items-center space-x-2 px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full text-amber-700 text-sm font-medium transition-colors group"
      >
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
        <span>Schema changes detected</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isTooltipOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Tooltip/Dropdown */}
      {isTooltipOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Database Changes</h4>
              <button onClick={() => setIsTooltipOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {/* Table Changes */}
              {diffData.tables.changed && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Tables</div>
                  <div className="space-y-1 text-xs">
                    {diffData.tables.added.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Plus className="w-3 h-3 text-green-600" />
                        <span className="text-green-700">
                          Added: {diffData.tables.added.map((t) => t.table).join(', ')}
                        </span>
                      </div>
                    )}
                    {diffData.tables.deleted.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Minus className="w-3 h-3 text-red-600" />
                        <span className="text-red-700">
                          Deleted: {diffData.tables.deleted.map((t) => t.table).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Column Changes */}
              {diffData.columns.changed && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Columns</div>
                  <div className="space-y-1 text-xs">
                    {diffData.columns.added.length > 0 && (
                      <div className="flex items-start space-x-2">
                        <Plus className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-green-700 font-medium">Added ({diffData.columns.added.length}):</span>
                          <div className="text-green-600 break-words">
                            {diffData.columns.added.map((c) => c.table).join(', ')}
                          </div>
                        </div>
                      </div>
                    )}

                    {diffData.columns.deleted.length > 0 && (
                      <div className="flex items-start space-x-2">
                        <Minus className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-red-700 font-medium">Deleted ({diffData.columns.deleted.length}):</span>
                          <div className="text-red-600 break-words">
                            {diffData.columns.deleted.map((c) => c.table).join(', ')}
                          </div>
                        </div>
                      </div>
                    )}

                    {diffData.columns.updated.length > 0 && (
                      <div className="flex items-start space-x-2">
                        <Edit className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-blue-700 font-medium">
                            Updated ({diffData.columns.updated.length}):
                          </span>
                          <div className="text-blue-600 break-words">
                            {diffData.columns.updated.map((c) => c.table).join(', ')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No specific changes message */}
              {!diffData.tables.changed && !diffData.columns.changed && (
                <div className="text-xs text-gray-500 italic">
                  Schema changes detected but details are not available.
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={onDismiss}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseDiff;
