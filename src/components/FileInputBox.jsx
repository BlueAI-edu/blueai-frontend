import { useRef, useState } from 'react';

function FileInputBox({onFileSelect, fileType, multiple = false, selectedFileName, disabled = false,}) {
  const fileInputRef = useRef(null);
  const [isDragActive, setDragActive] = useState(false);

  const handleFileSelect = (files) => {
    const selectedFiles = Array.from(files || []);

    if (!selectedFiles.length) return;

    onFileSelect(multiple ? selectedFiles : selectedFiles[0]);
  };

  const handleInputChange = (e) => {
    handleFileSelect(e.target.files);

    // Allows selecting the same file again after removing/rejecting it.
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;
    handleFileSelect(e.dataTransfer.files);
  };

  const fileTypeLabel = fileType
    .map((type) => type.replace('.', '').toUpperCase())
    .join(', ');

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        isDragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-blue-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept={fileType.join(',')}
        multiple={multiple}
        className="hidden"
        disabled={disabled}
      />

     {selectedFileName ? (
        <div>
            <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>

            <p className="text-gray-900 font-medium"> {selectedFileName} </p>

            <p className="text-sm text-gray-500 mt-1"> Click to select a different file </p>
        </div>
     ) : (
        <div>
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>

            <p className="text-gray-600"> Click to select a {fileTypeLabel} file </p>

            <p className="text-sm text-gray-400 mt-1"> or drag and drop </p>
        </div>
     )}
    </div>
  );
}

export default FileInputBox;