import React, { useState, useEffect } from 'react';
import { X, Database, Building2, Server, User, Lock, Tag } from 'lucide-react';

interface AddDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DatabaseFormData) => void;
  isLoading?: boolean;
}

interface DatabaseFormData {
  companyCode: string;
  companyName: string;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPw: string;
  dbName: string;
  dbTag: string;
}

const AddDatabaseModal: React.FC<AddDatabaseModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false
}) => {
  const [formData, setFormData] = useState<DatabaseFormData>({
    companyCode: '',
    companyName: '',
    dbHost: '',
    dbPort: 3306,
    dbUser: '',
    dbPw: '',
    dbName: '',
    dbTag: 'production',
  });

  const [errors, setErrors] = useState<Partial<DatabaseFormData>>({});

  // 모달이 닫힐 때만 폼 리셋
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        companyCode: '',
        companyName: '',
        dbHost: '',
        dbPort: 3306,
        dbUser: '',
        dbPw: '',
        dbName: '',
        dbTag: 'production',
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof DatabaseFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<DatabaseFormData> = {};

    if (!formData.companyCode.trim()) newErrors.companyCode = 'Company code is required';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.dbHost.trim()) newErrors.dbHost = 'Database host is required';
    if (!formData.dbUser.trim()) newErrors.dbUser = 'Database user is required';
    if (!formData.dbPw.trim()) newErrors.dbPw = 'Database password is required';
    if (!formData.dbName.trim()) newErrors.dbName = 'Database name is required';
    if (!formData.dbTag.trim()) newErrors.dbTag = 'Database tag is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
      // 폼 리셋과 모달 닫기는 부모 컴포넌트에서 성공 시에만 처리
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Add New Database</h3>
              <p className="text-sm text-gray-500">Connect a new database to your system</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Company Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-gray-600" />
              Company Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Code *</label>
                <input
                  type="text"
                  value={formData.companyCode}
                  onChange={(e) => handleInputChange('companyCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.companyCode ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="LOTTE"
                />
                {errors.companyCode && <p className="mt-1 text-sm text-red-600">{errors.companyCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.companyName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="롯데"
                />
                {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
              </div>
            </div>
          </div>

          {/* Database Connection */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <Server className="w-4 h-4 mr-2 text-gray-600" />
              Database Connection
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Database Host *</label>
                <input
                  type="text"
                  value={formData.dbHost}
                  onChange={(e) => handleInputChange('dbHost', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.dbHost ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="115.68.68.138"
                />
                {errors.dbHost && <p className="mt-1 text-sm text-red-600">{errors.dbHost}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port *</label>
                <input
                  type="number"
                  value={formData.dbPort}
                  onChange={(e) => handleInputChange('dbPort', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.dbPort ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="3306"
                />
                {errors.dbPort && <p className="mt-1 text-sm text-red-600">{errors.dbPort}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database User *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.dbUser}
                    onChange={(e) => handleInputChange('dbUser', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.dbUser ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="root"
                  />
                </div>
                {errors.dbUser && <p className="mt-1 text-sm text-red-600">{errors.dbUser}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    value={formData.dbPw}
                    onChange={(e) => handleInputChange('dbPw', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.dbPw ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.dbPw && <p className="mt-1 text-sm text-red-600">{errors.dbPw}</p>}
              </div>
            </div>
          </div>

          {/* Database Details */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <Database className="w-4 h-4 mr-2 text-gray-600" />
              Database Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database Name *</label>
                <input
                  type="text"
                  value={formData.dbName}
                  onChange={(e) => handleInputChange('dbName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.dbName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="cj2023"
                />
                {errors.dbName && <p className="mt-1 text-sm text-red-600">{errors.dbName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database Tag *</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={formData.dbTag}
                    onChange={(e) => handleInputChange('dbTag', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.dbTag ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="production">Production</option>
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="backup">Backup</option>
                    <option value="test">Test</option>
                  </select>
                </div>
                {errors.dbTag && <p className="mt-1 text-sm text-red-600">{errors.dbTag}</p>}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Database'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDatabaseModal;
