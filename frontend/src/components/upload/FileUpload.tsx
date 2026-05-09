import React, { useState, useCallback, useEffect } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle, X, Loader2, Eye } from 'lucide-react';

interface ValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validRows: any[];
  invalidRowCount: number;
  duplicateCount: number;
}

interface UploadProgress {
  uploadId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  error?: string;
}

interface ParsedUploadData {
  fileId: string;
  parseResult: {
    success: boolean;
    data: any[];
    headers: string[];
    rowCount: number;
    errors: string[];
  };
  validationResult: ValidationResult;
  previewData: any[];
}

export default function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [parsedData, setParsedData] = useState<ParsedUploadData | null>(null);
  const [error, setError] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = ['csv', 'xlsx', 'xls', 'json'];
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !allowedTypes.includes(extension)) {
      setError('Invalid file type. Please upload CSV, Excel, or JSON.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setFile(selectedFile);
    setError('');
    setParsedData(null);
    setUploadProgress(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress({
        uploadId: `temp-${Date.now()}`,
        status: 'processing',
        progress: 10,
        currentStep: 'Uploading file...',
      });

      // TODO: Replace with actual API call
      // const uploadResponse = await fetch('/api/v1/uploads', {
      //   method: 'POST',
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: formData,
      // });
      // const uploadData = await uploadResponse.json();

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const uploadId = `upload-${Date.now()}`;

      // Step 2: Validate file
      setUploadProgress(prev => ({
        ...prev!,
        progress: 30,
        currentStep: 'Validating file...',
      }));

      const validateFormData = new FormData();
      validateFormData.append('file', file);
      validateFormData.append('fileId', uploadId);

      // TODO: Replace with actual API call
      // const validateResponse = await fetch('/api/v1/uploads/validate', {
      //   method: 'POST',
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: validateFormData,
      // });
      // const parsedData = await validateResponse.json();

      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock parsed data for demo
      const mockParsedData: ParsedUploadData = {
        fileId: uploadId,
        parseResult: {
          success: true,
          data: [
            { constituency: 'North District', candidate: 'John Smith', party: 'Party A', votes: 15000, turnout: 65.5 },
            { constituency: 'South District', candidate: 'Jane Doe', party: 'Party B', votes: 12000, turnout: 58.2 },
          ],
          headers: ['constituency', 'candidate', 'party', 'votes', 'turnout'],
          rowCount: 2,
          errors: [],
        },
        validationResult: {
          valid: true,
          errors: [],
          warnings: [],
          validRows: [
            { constituency: 'North District', candidate: 'John Smith', party: 'Party A', votes: 15000, turnout: 65.5 },
            { constituency: 'South District', candidate: 'Jane Doe', party: 'Party B', votes: 12000, turnout: 58.2 },
          ],
          invalidRowCount: 0,
          duplicateCount: 0,
        },
        previewData: [
          { constituency: 'North District', candidate: 'John Smith', party: 'Party A', votes: 15000, turnout: 65.5 },
          { constituency: 'South District', candidate: 'Jane Doe', party: 'Party B', votes: 12000, turnout: 58.2 },
        ],
      };

      setParsedData(mockParsedData);

      setUploadProgress(prev => ({
        ...prev!,
        progress: 100,
        currentStep: 'Validation complete',
        status: 'completed',
      }));

      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
      setUploadProgress(prev => ({
        ...prev!,
        progress: 0,
        currentStep: 'Upload failed',
        status: 'failed',
        error: err.message,
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;

    setIsUploading(true);
    setError('');

    try {
      setUploadProgress(prev => ({
        ...prev!,
        status: 'processing',
        progress: 0,
        currentStep: 'Starting import...',
      }));

      // TODO: Replace with actual API call
      // await fetch('/api/v1/uploads/confirm', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({
      //     fileId: parsedData.fileId,
      //     electionId: '',
      //     constituencyId: '',
      //   }),
      // });

      // Simulate import progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setUploadProgress(prev => ({
          ...prev!,
          progress: i,
          currentStep: `Importing data... ${i}%`,
        }));
      }

      setUploadProgress(prev => ({
        ...prev!,
        progress: 100,
        currentStep: 'Import complete',
        status: 'completed',
      }));

      // Reset form
      setFile(null);
      setParsedData(null);
      setShowPreview(false);
      setUploadProgress(null);
    } catch (err: any) {
      setError(err.message || 'Import failed. Please try again.');
      setUploadProgress(prev => ({
        ...prev!,
        status: 'failed',
        currentStep: 'Import failed',
        error: err.message,
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setParsedData(null);
    setShowPreview(false);
    setUploadProgress(null);
    setError('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (!file) return null;
    const extension = file.name.split('.').pop()?.toLowerCase();
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Election Dataset</h2>
        <p className="text-gray-600">Upload your election data in CSV, Excel, or JSON format. We'll validate and preview the data before importing.</p>
      </div>

      {/* Upload Area */}
      {!file && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".csv,.xlsx,.xls,.json"
            onChange={handleFileInputChange}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            <div className="p-4 bg-white rounded-full shadow-sm">
              <UploadCloud className="w-12 h-12 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 mb-1">
                Drop your file here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports CSV, Excel (.xlsx, .xls), and JSON files (max 10MB)
              </p>
            </div>
            <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Select File
            </button>
          </label>
        </div>
      )}

      {/* File Selected */}
      {file && !showPreview && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {getFileIcon()}
              <div>
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {uploadProgress && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{uploadProgress.currentStep}</span>
                <span className="text-sm text-gray-500">{uploadProgress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    uploadProgress.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
              {uploadProgress.error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{uploadProgress.error}</p>
                </div>
              )}
            </div>
          )}

          {!isUploading && (
            <button
              onClick={handleUpload}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-5 h-5" />
              Upload & Validate
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900 mb-1">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Validation Results & Preview */}
      {showPreview && parsedData && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Validation Complete</h3>
              <p className="text-sm text-gray-500">
                {parsedData.parseResult.rowCount} rows processed
              </p>
            </div>
            {parsedData.validationResult.valid ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Valid</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Invalid</span>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {parsedData.validationResult.errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Errors ({parsedData.validationResult.errors.length})
              </h4>
              <div className="space-y-2">
                {parsedData.validationResult.errors.slice(0, 5).map((err, idx) => (
                  <div key={idx} className="text-sm text-red-700">
                    <span className="font-medium">Row {err.row}:</span> {err.field} - {err.message}
                  </div>
                ))}
                {parsedData.validationResult.errors.length > 5 && (
                  <p className="text-sm text-red-600">
                    ... and {parsedData.validationResult.errors.length - 5} more errors
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Validation Warnings */}
          {parsedData.validationResult.warnings.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-3">
                Warnings ({parsedData.validationResult.warnings.length})
              </h4>
              <div className="space-y-2">
                {parsedData.validationResult.warnings.slice(0, 5).map((warn, idx) => (
                  <div key={idx} className="text-sm text-yellow-700">
                    <span className="font-medium">Row {warn.row}:</span> {warn.field} - {warn.message}
                  </div>
                ))}
                {parsedData.validationResult.warnings.length > 5 && (
                  <p className="text-sm text-yellow-600">
                    ... and {parsedData.validationResult.warnings.length - 5} more warnings
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-2xl font-bold text-green-900">{parsedData.validationResult.validRows.length}</p>
              <p className="text-sm text-green-700">Valid Rows</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-2xl font-bold text-red-900">{parsedData.validationResult.invalidRowCount}</p>
              <p className="text-sm text-red-700">Invalid Rows</p>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-2xl font-bold text-yellow-900">{parsedData.validationResult.duplicateCount}</p>
              <p className="text-sm text-yellow-700">Duplicates</p>
            </div>
          </div>

          {/* Preview Toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="mb-4 flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>

          {/* Preview Table */}
          {showPreview && parsedData.previewData.length > 0 && (
            <div className="overflow-x-auto border border-gray-200 rounded-lg mb-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {parsedData.parseResult.headers.map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parsedData.previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {parsedData.parseResult.headers.map((header, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-3 text-sm text-gray-700">
                          {row[header] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            {parsedData.validationResult.valid ? (
              <button
                onClick={handleConfirmImport}
                disabled={isUploading}
                className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Import
                  </>
                )}
              </button>
            ) : (
              <button
                disabled
                className="flex-1 py-3 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
              >
                Fix Errors to Import
              </button>
            )}
          </div>
        </div>
      )}

      {/* Import Progress */}
      {uploadProgress && uploadProgress.status === 'processing' && !showPreview && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{uploadProgress.currentStep}</p>
              <p className="text-sm text-gray-500">{uploadProgress.progress}% complete</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
