import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTrash, FaUndo, FaArrowLeft, FaFile, FaFileImage, FaFilePdf, FaFileAudio, FaFileVideo, FaFileCode, FaFileArchive, FaFileAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TrashPage = () => {
    const [trashItems, setTrashItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState([]);
    const navigate = useNavigate();

    // Fetch trash items
    useEffect(() => {
        const fetchTrash = async () => {
            const token = localStorage.getItem('myspace_token');
            if (!token) return navigate('/login');

            try {
                const res = await axios.get('/api/trash', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTrashItems(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching trash:', err);
                toast.error('Failed to load trash items');
                setLoading(false);
            }
        };

        fetchTrash();
    }, [navigate]);

    // Handle restore
    const handleRestore = async (id) => {
        try {
            const token = localStorage.getItem('myspace_token');
            await axios.post(`/api/trash/restore/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setTrashItems(trashItems.filter(item => item.id !== id));
            toast.success('File restored successfully');
        } catch (err) {
            console.error('Error restoring file:', err);
            toast.error('Failed to restore file');
        }
    };

    // Handle permanent delete
    const handleDeletePermanently = async (id) => {
        try {
            const token = localStorage.getItem('myspace_token');
            await axios.delete(`/api/trash/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setTrashItems(trashItems.filter(item => item.id !== id));
            toast.success('File permanently deleted');
        } catch (err) {
            console.error('Error deleting file:', err);
            toast.error('Failed to delete file');
        }
    };

    // Handle empty trash
    const handleEmptyTrash = async () => {
        if (!window.confirm('Are you sure you want to empty the trash? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('myspace_token');
            await axios.delete('/api/trash', {
                headers: { Authorization: `Bearer ${token}` },
            });

            setTrashItems([]);
            toast.success('Trash emptied successfully');
        } catch (err) {
            console.error('Error emptying trash:', err);
            toast.error('Failed to empty trash');
        }
    };

    // Toggle item selection
    const toggleItemSelection = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    // Get file icon based on type
    const getFileIcon = (type) => {
        const typeMap = {
            'image': <FaFileImage className="text-blue-500 text-2xl" />,
            'pdf': <FaFilePdf className="text-red-500 text-2xl" />,
            'audio': <FaFileAudio className="text-purple-500 text-2xl" />,
            'video': <FaFileVideo className="text-green-500 text-2xl" />,
            'code': <FaFileCode className="text-yellow-500 text-2xl" />,
            'archive': <FaFileArchive className="text-orange-500 text-2xl" />,
            'document': <FaFileAlt className="text-gray-500 text-2xl" />,
            'note': <FaFileAlt className="text-green-500 text-2xl" />,
            'default': <FaFile className="text-gray-400 text-2xl" />
        };

        const fileType = type.toLowerCase();
        if (fileType.includes('image')) return typeMap.image;
        if (fileType.includes('pdf')) return typeMap.pdf;
        if (fileType.includes('audio')) return typeMap.audio;
        if (fileType.includes('video')) return typeMap.video;
        if (fileType.includes('zip') || fileType.includes('rar')) return typeMap.archive;
        if (fileType.includes('text') || fileType.includes('code')) return typeMap.code;
        if (fileType.includes('document') || fileType.includes('word') || fileType.includes('excel')) return typeMap.document;

        return typeMap.default;
    };

    // Format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div className="flex items-center mb-4 sm:mb-0">
                        <button
                            onClick={() => navigate(-1)}
                            className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                        >
                            <FaArrowLeft className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Trash</h1>
                    </div>

                    {trashItems.length > 0 && (
                        <button
                            onClick={handleEmptyTrash}
                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
                        >
                            <FaTrash className="mr-2" />
                            Empty Trash
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">Loading trash items...</p>
                        </div>
                    ) : trashItems.length === 0 ? (
                        <div className="p-8 text-center">
                            <FaTrash className="mx-auto text-gray-300 dark:text-gray-600 text-4xl mb-4" />
                            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Your trash is empty</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Items you delete will appear here</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {/* Table header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <div className="col-span-6 md:col-span-5">Name</div>
                                <div className="hidden md:block md:col-span-2">Size</div>
                                <div className="hidden md:block md:col-span-3">Deleted</div>
                                <div className="col-span-6 md:col-span-2 text-right">Actions</div>
                            </div>

                            {/* Trash items */}
                            {trashItems.map((item) => (
                                <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-900">
                                    <div className="col-span-6 md:col-span-5 flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                                            {item.type.includes('image') ? (
                                                <img
                                                    src={`http://localhost:5000/${item.path.split('/').pop()}`}
                                                    alt={item.name}
                                                    className="h-10 w-10 object-cover rounded"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.parentElement.innerHTML = getFileIcon(item.type);
                                                        console.log('Image URL does not exit (L190):', `http://localhost:5000/${item.path.split('/').pop()}`);
                                                    }}
                                                />
                                            ) : (
                                                getFileIcon(item.type)
                                            )}
                                        </div>
                                        <div className="ml-4 overflow-hidden">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {item.type} • Deleted from folder {item.folder_id}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="hidden md:block md:col-span-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(item.size)}</p>
                                    </div>

                                    <div className="hidden md:block md:col-span-3">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(item.deleted_at)}</p>
                                    </div>

                                    <div className="col-span-6 md:col-span-2 flex justify-end space-x-2">
                                        <button
                                            onClick={() => handleRestore(item.id)}
                                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors"
                                            title="Restore"
                                        >
                                            <FaUndo />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePermanently(item.id)}
                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                            title="Delete permanently"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrashPage;