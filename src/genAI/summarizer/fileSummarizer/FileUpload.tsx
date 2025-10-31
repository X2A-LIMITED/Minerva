import { useCallback, useRef, useState, type DragEventHandler } from 'react';
import { FileText, Upload } from 'lucide-react';
import './shimmer.css';

interface PdfUploaderProps {
    onFileSelect: (file: File) => void;
    isLoading?: boolean;
}

const isFileTypeAllowed = (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
};

const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
};

export const PdfUploader = ({
    onFileSelect,
    isLoading = false,
}: PdfUploaderProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // https://ai.google.dev/gemini-api/docs/image-understanding#supported-formats
    const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
    ];
    const handleDragEnter: DragEventHandler = e => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave: DragEventHandler = e => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver: DragEventHandler = e => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop: DragEventHandler = e => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (isFileTypeAllowed(file, ALLOWED_MIME_TYPES)) {
                setSelectedFile(file);

                if (isImageFile(file)) {
                    const reader = new FileReader();
                    reader.onload = e => {
                        setImagePreview(e.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                } else {
                    setImagePreview(null);
                }

                onFileSelect(file);
            } else {
                alert('Please upload a supported file type');
            }
        }
    };

    const handleClick = useCallback(() => {
        if (imagePreview && selectedFile) return;
        fileInputRef.current?.click();
    }, [fileInputRef, imagePreview, selectedFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (isFileTypeAllowed(file, ALLOWED_MIME_TYPES)) {
                setSelectedFile(file);

                if (isImageFile(file)) {
                    const reader = new FileReader();
                    reader.onload = e => {
                        setImagePreview(e.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                } else {
                    setImagePreview(null);
                }

                onFileSelect(file);
            } else {
                alert('Please upload a supported file type');
            }
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        setImagePreview(null);
    };

    const containerStyle: React.CSSProperties = {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: imagePreview && selectedFile ? 'auto' : '280px',
        border: isDragging
            ? '3px dashed #007bff'
            : selectedFile
              ? '2px solid #28a745'
              : '2px dashed #d1d5db',
        borderRadius: '16px',
        cursor: imagePreview && selectedFile ? 'default' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: isDragging
            ? 'rgba(0, 123, 255, 0.08)'
            : selectedFile
              ? 'rgba(40, 167, 69, 0.05)'
              : 'rgba(248, 249, 250, 0.8)',
        padding: '32px 24px',
        boxShadow: isDragging
            ? '0 8px 24px rgba(0, 123, 255, 0.15), inset 0 0 0 1px rgba(0, 123, 255, 0.1)'
            : selectedFile
              ? '0 4px 12px rgba(40, 167, 69, 0.12)'
              : '0 2px 8px rgba(0, 0, 0, 0.06)',
    };

    const removeButtonStyle: React.CSSProperties = {
        marginTop: '20px',
        padding: '10px 20px',
        background: 'linear-gradient(135deg, #dc3545 0%, #bd2130 100%)',
        color: 'white',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(220, 53, 69, 0.25)',
    };

    return (
        <div
            style={containerStyle}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_MIME_TYPES.join(',')}
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            {selectedFile ? (
                <>
                    {imagePreview ? (
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                position: 'relative',
                                marginBottom: '16px',
                            }}
                        >
                            <img
                                src={imagePreview}
                                alt={selectedFile.name}
                                className={isLoading ? 'shimmer' : ''}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '300px',
                                    objectFit: 'contain',
                                    borderRadius: '12px',
                                    border: '2px solid rgba(40, 167, 69, 0.2)',
                                }}
                            />
                            {isLoading && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(8px)',
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        boxShadow:
                                            '0 4px 12px rgba(0, 0, 0, 0.15)',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#007bff',
                                    }}
                                >
                                    Analyzing...
                                </div>
                            )}
                        </div>
                    ) : (
                        <FileText
                            size={72}
                            color="#28a745"
                            style={{ marginBottom: '20px' }}
                        />
                    )}
                    {!isLoading && (
                        <>
                            <p
                                style={{
                                    fontSize: '12px',
                                    color: '#28a745',
                                    fontWeight: 600,
                                    marginTop: '8px',
                                }}
                            >
                                {selectedFile.name}
                            </p>
                            <p
                                style={{
                                    fontSize: '13px',
                                    color: '#666',
                                    fontWeight: 500,
                                    marginBottom: '4px',
                                }}
                            >
                                {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>

                            <button
                                onClick={handleRemove}
                                style={removeButtonStyle}
                                onMouseOver={e => {
                                    e.currentTarget.style.transform =
                                        'translateY(-2px)';
                                    e.currentTarget.style.boxShadow =
                                        '0 6px 16px rgba(220, 53, 69, 0.35)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.transform =
                                        'translateY(0)';
                                    e.currentTarget.style.boxShadow =
                                        '0 4px 12px rgba(220, 53, 69, 0.25)';
                                }}
                            >
                                Remove File
                            </button>
                        </>
                    )}
                </>
            ) : (
                <>
                    <Upload
                        size={56}
                        color={isDragging ? '#007bff' : '#9ca3af'}
                        style={{
                            marginBottom: '20px',
                            transition: 'all 0.3s ease',
                        }}
                    />
                    <p
                        style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: isDragging ? '#007bff' : '#2c2c2c',
                            marginBottom: '8px',
                            transition: 'color 0.3s ease',
                        }}
                    >
                        {isDragging
                            ? 'Drop your file here'
                            : 'Click or drag file here'}
                    </p>
                    <p
                        style={{
                            fontSize: '13px',
                            color: '#999',
                            marginTop: '4px',
                        }}
                    >
                        Supports PDF, JPEG, PNG, WebP, HEIC
                    </p>
                </>
            )}
        </div>
    );
};
