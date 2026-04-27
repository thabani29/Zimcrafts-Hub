import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const ImageUploader = ({ onImagesSelected, onRemoveImage, images = [], maxImages = 5 }) => {
    const [previews, setPreviews] = useState([]);

    const onDrop = useCallback((acceptedFiles) => {
        if (images.length + acceptedFiles.length > maxImages) {
            alert(`You can only upload up to ${maxImages} images`);
            return;
        }

        // Create preview URLs
        const newPreviews = acceptedFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        setPreviews(prev => [...prev, ...newPreviews]);
        onImagesSelected(acceptedFiles);
    }, [images.length, maxImages, onImagesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        maxSize: 5 * 1024 * 1024, // 5MB
        multiple: true
    });

    const handleRemoveImage = (index) => {
        // Revoke the object URL to avoid memory leaks
        URL.revokeObjectURL(previews[index].preview);
        setPreviews(prev => prev.filter((_, i) => i !== index));
        onRemoveImage(index);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                        ? 'border-primary-orange bg-orange-50'
                        : 'border-gray-300 hover:border-primary-orange hover:bg-gray-50'
                }`}
            >
                <input {...getInputProps()} />
                <div className="space-y-2">
                    <div className="text-4xl">📸</div>
                    {isDragActive ? (
                        <p className="text-primary-orange">Drop the images here...</p>
                    ) : (
                        <>
                            <p className="text-gray-600">
                                Drag & drop images here, or click to select
                            </p>
                            <p className="text-sm text-gray-500">
                                Max {maxImages} images • JPEG, PNG, GIF • Up to 5MB each
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Image Preview Grid */}
            {previews.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Selected Images ({previews.length}/{maxImages})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={preview.preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    ×
                                </button>
                                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                    {formatFileSize(preview.file.size)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Image Count */}
            <p className="text-sm text-gray-500 text-right">
                {previews.length} / {maxImages} images selected
            </p>
        </div>
    );
};

export default ImageUploader;