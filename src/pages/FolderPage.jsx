import React, { useEffect, useState, useRef, useContext } from 'react';
import Sidebar from './Sidebar';
import {
  FaArrowLeft,
  FaSearch,
  FaCog,
  FaTrash,
  FaUpload,
  FaEllipsisV,
  FaShareAlt,
  FaSortAmountDownAlt,
  FaTrashAlt,
  FaCalendarAlt,
  FaThumbtack,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaThLarge,
  FaRegEye,
  FaPencilAlt,
  FaFileAlt,
  FaImage,
  FaMusic,
  FaVideo,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileArchive,
  FaFileCode,
  FaFolder,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTimes,
  FaList,
  FaFont,
  FaPlay,
  FaPause,
  FaDownload,
  FaPlus,
  FaCheck,
  FaRegCopy,
  FaUndoAlt,
  FaRedoAlt,
  FaArrowRight,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaSpinner,
  FaEdit,
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import '../App.css';
import { toast } from 'react-toastify';
import { useEditor, EditorContent, BubbleMenu, } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Document from '@tiptap/extension-document';
import { Image } from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import FileImagePreview from './FileImagePreview';
import { useTheme } from './ThemeContext';

const FolderPage = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [folder, setFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [sortMode, setSortMode] = useState({ by: 'name', order: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [spaceName, setSpaceName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [previewContent, setPreviewContent] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [lyricsModalVisible, setLyricsModalVisible] = useState(false);
  const [lyricsContent, setLyricsContent] = useState('');
  const [lyricsFile, setLyricsFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const CustomDocument = Document.extend({
    content: 'block+',
  })
  const editor = useEditor({
    extensions: [
      CustomDocument,
      StarterKit.configure({
        document: false,
        bulletList: {
          keepMarks: true,
        },
        orderedList: {
          keepMarks: true,
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-gray-100 p-2 rounded-md font-mono',
          },
        },
      }),
      Placeholder.configure({
        placeholder: 'Write your note here...',
      }),
      Underline,
      TextStyle, // required by Highlight
      Highlight,
      Table.configure({
        resizable: true,
        htmlAttributes: { class: 'w-full' },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-2',
        },
      }),
    ],
    content: noteContent,
    editorProps: {
      attributes: {
        class: 'h-full w-full outline-none prose max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      setNoteContent(editor.getHTML());
    },
  });
  useEffect(() => {
    if (editor && noteContent) {
      editor.commands.setContent(noteContent);
    }
  }, [editor, noteContent]);

  const [noteName, setNoteName] = useState('');
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showLyricsInput, setShowLyricsInput] = useState(null);
  const [lyrics, setLyrics] = useState('');
  const audioRef = useRef(null);
  const fileRefs = useRef({});
  const actionsMenuRef = useRef(null);
  const sortMenuRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [fileLyricsMap, setFileLyricsMap] = useState({});

  const token = localStorage.getItem('myspace_token');
  const user = JSON.parse(localStorage.getItem('myspace_user'));

  const [copiedPreview, setCopiedPreview] = useState(false);

  function handleCopyPreview() {
    if (previewContent) {
      navigator.clipboard.writeText(previewContent.content)
        .then(() => {
          setCopiedPreview(true);
          setTimeout(() => setCopiedPreview(false), 1500);
        })
        .catch(console.error);
    }
  }

  function handleEditNote() {
    setNoteName(previewContent.name);
    setNoteContent(previewContent.content);
    setShowNoteEditor(true);
    setShowPreviewModal(false);
  }

  // File type icons mapping
  const fileIcons = {
    'image': <FaImage className="text-blue-500" />,
    'audio': <FaMusic className="text-purple-500" />,
    'video': <FaVideo className="text-red-500" />,
    'application/pdf': <FaFilePdf className="text-red-500" />,
    'application/msword': <FaFileWord className="text-blue-600" />,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <FaFileWord className="text-blue-600" />,
    'application/vnd.ms-excel': <FaFileExcel className="text-green-600" />,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': <FaFileExcel className="text-green-600" />,
    'application/vnd.ms-powerpoint': <FaFilePowerpoint className="text-orange-600" />,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': <FaFilePowerpoint className="text-orange-600" />,
    'application/zip': <FaFileArchive className="text-yellow-600" />,
    'application/x-rar-compressed': <FaFileArchive className="text-yellow-600" />,
    'application/x-7z-compressed': <FaFileArchive className="text-yellow-600" />,
    'text/html': <FaFileCode className="text-pink-500" />,
    'text/css': <FaFileCode className="text-blue-500" />,
    'text/javascript': <FaFileCode className="text-yellow-500" />,
    'text/plain': <FaFileAlt className="text-gray-500" />,
    'default': <FaFileAlt className="text-gray-500" />
  };

  const handleMediaNavigation = direction => {
    const newIndex = currentMediaIndex + direction;
    if (newIndex >= 0 && newIndex < mediaFiles.length) {
      const newFile = mediaFiles[newIndex];
      setCurrentMediaIndex(newIndex);
      fetch(`/api/files/${newFile.id}/view`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setMediaBlobUrl(url);
        })
        .catch(err => console.error('Error loading media:', err));
    }
  };

  const handlePlayAudio = (file) => {
    if (currentAudio === file.id) {
      audioRef.current.pause();
      setCurrentAudio(null);
    } else {
      setCurrentAudio(file.id);
      fetch(`/api/files/${file.id}/view`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch audio');
          return res.blob();
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          audioRef.current.src = url;
          audioRef.current.play();
        })
        .catch(err => console.error('Error playing audio:', err));
    }
  };

  const handleShowLyrics = (file) => {
    fetch(`/api/files/${file.id}/lyrics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) {
          setLyricsContent(null);
          setLyricsFile(file);
        } else {
          return res.text();
        }
      })
      .then(text => {
        if (text) {
          setLyricsContent(text);
        }
        setLyricsModalVisible(true);
      })
      .catch(err => {
        console.error('Error fetching lyrics:', err);
        setLyricsContent(null);
        setLyricsFile(file);
        setLyricsModalVisible(true);
      });
  };

  const fetchLyricsForFile = (file) => {
    if (fileLyricsMap[file.id] !== undefined) return;

    fetch(`/api/files/${file.id}/lyrics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('No lyrics');
        return res.text();
      })
      .then(text => {
        setFileLyricsMap(prev => ({ ...prev, [file.id]: text }));
      })
      .catch(() => {
        setFileLyricsMap(prev => ({ ...prev, [file.id]: null }));
      });
  };


  const handleCopy = () => {
    if (!editor) return;
    navigator.clipboard.writeText(editor.getText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      editor.chain().focus().setImage({ src: base64 }).run();
    };
    reader.readAsDataURL(file);
  };
  const buttonStyle = (active = false) =>
    `px-3 py-1 rounded-md text-sm font-medium transition border flex items-center gap-1 ${active
      ? "bg-indigo-100 text-indigo-700 border-indigo-300"
      : "hover:bg-gray-100 text-gray-700 border-transparent"
    }`;

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setShowActionsMenu(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Audio progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
    };
  }, [currentAudio]);

  useEffect(() => {
    if (!token) return navigate('/login');

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [folderRes, filesRes] = await Promise.all([
          axios.get(`/api/folders/${folderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/files/${folderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        setFolder(folderRes.data);
        setSpaceName(folderRes.data.name);
        setFiles(Array.isArray(filesRes.data) ? filesRes.data : []);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load folder data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [folderId, token, navigate]);

  const filteredFiles = (Array.isArray(files) ? files : [])
    .filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = sortMode.by === 'date' ? new Date(a.uploaded_at) : a.name.toLowerCase();
      const bVal = sortMode.by === 'date' ? new Date(b.uploaded_at) : b.name.toLowerCase();
      return sortMode.order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  const handleNameSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `/api/folders/${folderId}`,
        { name: spaceName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditing(false);
      toast.success('Folder name updated successfully');
    } catch (err) {
      console.error('Error updating folder name:', err);
      toast.error('Failed to update folder name');
    }
  };
  const getMediaDuration = (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const media = document.createElement(file.type.startsWith('audio') ? 'audio' : 'video');

      media.preload = 'metadata';
      media.src = url;

      media.onloadedmetadata = () => {
        URL.revokeObjectURL(url); // cleanup
        resolve(media.duration);
      };

      media.onerror = (e) => {
        reject(new Error("Failed to load media file for duration extraction."));
      };
    });
  };

  const handleFileUpload = async (e) => {
    e.preventDefault()
    const files = Array.from(e.target.files);
    const newFiles = await Promise.all(
      files.map(async (f) => {
        const fileType = f.type.split('/')[0];

        const isValidType = folder.type === 'note'
          ? f.type.includes('text')
          : folder.type === fileType ||
          (folder.type === 'document' || folder.type === 'pdf' && ['pdf', 'msword', 'vnd.openxmlformats-officedocument'].some(t => f.type.includes(t))) ||
          (folder.type === 'video' && fileType === 'video');

        let duration = null;
        if (fileType === 'video' || fileType === 'audio') {
          try {
            duration = await getMediaDuration(f);
          } catch (err) {
            console.warn(`Could not extract duration for file ${f.name}`, err);
          }
        }

        return {
          file: f,
          error: !isValidType,
          progress: 0,
          duration, // ⏱️ media duration in seconds (float)
        };
      })
    );

    setUploadQueue(old => [...old, ...newFiles]);
    console.log('Uploading files with metadata:', newFiles);
  };

  const submitUploads = async () => {
    try {
      const formData = new FormData();
      uploadQueue.forEach(u => formData.append('files', u.file));

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadQueue(prev => prev.map(item => ({
            ...item,
            progress: progress
          })));
        }
      };

      await axios.post(`/api/folders/${folderId}/upload`, formData, config);

      // Refresh files after upload
      const res = await axios.get(`/api/files/${folderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFiles(Array.isArray(res.data) ? res.data : []);
      setUploadQueue([]);
      toast.success('Files uploaded successfully');
    } catch (err) {
      console.error('Error uploading files:', err);
      toast.error('Failed to upload files');
    }
  };

  const handleCreateNote = async () => {
    if (!noteName.trim()) {
      toast.error('Please enter a note name');
      return;
    }

    try {
      const res = await axios.post(`/api/files/note`, {
        folderId,
        name: noteName,
        content: noteContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFiles(prev => [...prev, res.data]);
      setShowNoteEditor(false);
      setNoteContent('');
      setNoteName('');
      editor?.commands.clearContent();
      toast.success('Note created successfully');
    } catch (err) {
      console.error('Error creating note:', err);
      toast.error('Failed to create note');
    }
  };

  const handleFileAction = async (file, action) => {
    try {
      switch (action) {
        case 'view':
          const isMediaFile =
            file.type.includes('image') ||
            file.type.includes('video') ||
            (file.type.includes('application') && !file.type.includes('json') && !file.type.includes('msword') && !file.type.includes('note'));

          if (file.type.includes('pdf')) {
            // Open blob for pdf
            fetch(`/api/files/${file.id}/view`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(res => {
                if (!res.ok) throw new Error('Failed to fetch file');
                return res.blob();
              })
              .then(blob => {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
              })
              .catch(err => console.error('Error opening file:', err));
          } else if (file.type.startsWith('audio/')) {
            // Show lyrics modal for audio files
            fetch(`/api/files/${file.id}/lyrics`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(res => {
                if (!res.ok) {
                  setLyricsContent(null);
                  setLyricsFile(file);
                } else {
                  return res.text();
                }
              })
              .then(text => {
                if (text) {
                  setLyricsContent(text);
                }
                setLyricsModalVisible(true);
              })
              .catch(err => {
                console.error('Error fetching lyrics:', err);
                setLyricsContent(null);
                setLyricsFile(file);
                setLyricsModalVisible(true);
              });

          } else if (isMediaFile) {
            const allMedia = files.filter(f =>
              f.type.includes('image') ||
              f.type.includes('video') ||
              (f.type.includes('application') && !f.type.includes('json') && !f.type.includes('msword') && !f.type.includes('note'))
            );
            const index = allMedia.findIndex(f => f.id === file.id);
            setMediaFiles(allMedia);
            setCurrentMediaIndex(index);

            fetch(`/api/files/${file.id}/view`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(res => {
                if (!res.ok) throw new Error('Failed to fetch file');
                return res.blob();
              })
              .then(blob => {
                const url = URL.createObjectURL(blob);
                setMediaBlobUrl(url);
                setMediaModalVisible(true);
              })
              .catch(err => console.error('Error opening file:', err));
          }
          else {
            // View text-like file content in modal (note, doc, txt, etc.)
            fetch(`/api/files/${file.id}/view`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(res => {
                if (!res.ok) throw new Error('Failed to fetch file content');
                return res.text();
              })
              .then(text => {
                const isNote = file.type.includes('note') || file.type.includes('html');
                setPreviewContent({
                  id: file.id,
                  name: file.name,
                  type: file.type,
                  content: text,
                  isNote,
                });
                setShowPreviewModal(true);
              })
              .catch(err => console.error('Error previewing file:', err));
          }
          break;

        case 'share':
          const shareUrl = `${window.location.origin}/share/${file.id}`;
          if (navigator.share) {
            await navigator.share({
              title: file.name,
              text: 'Check out this file',
              url: shareUrl
            });
          } else {
            navigator.clipboard.writeText(shareUrl);
            toast.info('Share link copied to clipboard');
          }
          break;

        case 'delete':
          setFileToDelete(file);
          setDeleteModalVisible(true); l
          break;

        case 'pin':
          await axios.put(
            `/api/files/${file.id}/pin`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setFiles(files.map(f => f.id === file.id ? { ...f, pinned: !f.pinned } : f));
          toast.success(`File ${file.pinned ? 'unpinned' : 'pinned'} successfully`);
          break;

        case 'download':
          fetch(`/api/files/${file.id}/view`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then(res => {
              if (!res.ok) throw new Error('Failed to fetch file');
              return res.blob();
            })
            .then(blob => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.name || 'download';
              document.body.appendChild(a);
              a.click();
              a.remove();
            })
            .catch(err => console.error('Error downloading file:', err));
          break;

        case 'add-lyrics':
          if (showLyricsInput === file.id) {
            // Save lyrics
            await axios.put(
              `/api/files/${file.id}/lyrics`,
              { lyrics },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowLyricsInput(null);
            setLyrics('');
            toast.success('Lyrics added successfully');
          } else {
            // Show lyrics input
            setShowLyricsInput(file.id);
          }
          break;

        default:
          break;
      }
    } catch (err) {
      console.error(`Error performing ${action} on file:`, err);
      toast.error(`Failed to ${action} file`);
    }
  };

  const handleScrollTo = (fileId) => {
    const el = fileRefs.current[fileId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-indigo-300', 'transition-all', 'duration-300');
      setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-300'), 1500);
    }
  };

  const getFileIcon = (fileType) => {
    const type = fileType.split('/')[0];
    const subtype = fileType;

    if (fileIcons[subtype]) return fileIcons[subtype];
    if (fileIcons[type]) return fileIcons[type];
    return fileIcons['default'];
  };

  const removeFromUploadQueue = (index) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Folder not found</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />

      {/* Desktop sidebar */}
      <Sidebar
        isMobile={false}
        navigate={navigate}
        files={files}
        folder={folder}
        handleScrollTo={handleScrollTo}
        getFileIcon={getFileIcon}
        setShowNoteEditor={setShowNoteEditor}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <Sidebar
            isMobile
            onClose={() => setSidebarOpen(false)}
            navigate={navigate}
            files={files}
            folder={folder}
            handleScrollTo={handleScrollTo}
            getFileIcon={getFileIcon}
            setShowNoteEditor={setShowNoteEditor}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/*Modal to display note */}
        {showPreviewModal && previewContent && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">{previewContent.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyPreview}
                    className="px-3 py-1 bg-blue-100 rounded hover:bg-blue-200 flex items-center gap-1"
                  >
                    <FaRegCopy />
                    {copiedPreview ? (
                      <span className="text-green-600 text-sm animate-pulse">Copied!</span>
                    ) : (
                      <span>Copy</span>
                    )}
                  </button>

                  <button onClick={handleEditNote} className="px-3 py-1 bg-green-100 rounded hover:bg-green-200">
                    Edit
                  </button>
                  <button onClick={() => setShowPreviewModal(false)} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Display HTML Content */}
              <div
                className="tiptap overflow-auto"
                dangerouslySetInnerHTML={{ __html: previewContent.content }}
              />
            </div>
          </div>
        )}

        {/*Modal to confirm delete */}
        {deleteModalVisible && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-96">
              <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
              <p className="mb-6">Are you sure you want to delete <strong>{fileToDelete?.name}</strong>?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setDeleteModalVisible(false);
                    setFileToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await axios.delete(`/api/files/${fileToDelete.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
                      toast.success('File deleted successfully');
                    } catch (err) {
                      console.error('Delete error:', err);
                      toast.error('Failed to delete file');
                    } finally {
                      setDeleteModalVisible(false);
                      setFileToDelete(null);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/*Modal to display lyrics */}
        {lyricsModalVisible && (
          <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <FaMusic className="text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Song Lyrics</h2>
                </div>
                <button
                  onClick={() => setLyricsModalVisible(false)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close lyrics"
                >
                  <FaTimes className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto py-2">
                {lyricsContent ? (
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300 leading-relaxed">
                    {lyricsContent}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <FaMusic className="text-gray-400 dark:text-gray-500 text-4xl mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No lyrics found for this song</p>
                    <button
                      onClick={() => handleFileAction(lyricsFile, 'add-lyrics')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <FaPlus size={12} />
                      <span>Add Lyrics</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Footer (optional) */}
              {lyricsContent && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-right">
                  <button
                    onClick={() => handleFileAction(lyricsFile, 'add-lyrics')}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 ml-auto"
                  >
                    <FaPlus size={10} />
                    <span>Edit Lyrics</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/*Modal to display images */}
        {mediaModalVisible && (
          <div className="fixed inset-0 backdrop-blur-xs bg-black/30 bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-full max-h-full">
              {/* Close button */}
              <button
                onClick={() => setMediaModalVisible(false)}
                className="fixed top-10 right-30 text-white opacity-50 hover:text-gray-300 transition-colors"
                aria-label="Close media viewer"
              >
                <FaTimes size={24} />
              </button>

              {/* Navigation buttons */}
              <div className="absolute inset-0 flex items-center justify-between">
                <button
                  disabled={currentMediaIndex <= 0}
                  onClick={() => handleMediaNavigation(-1)}
                  className={`fixed left-20 opacity-30 p-4 text-gray-600 hover:bg-purple-100 hover:opacity-20 rounded-full transition-all ${currentMediaIndex <= 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-90'}`}
                  aria-label="Previous media"
                >
                  <FaChevronLeft size={32} />
                </button>

                <button
                  disabled={currentMediaIndex >= mediaFiles.length - 1}
                  onClick={() => handleMediaNavigation(1)}
                  className={`fixed right-20 opacity-30 p-4 text-gray-600 hover:bg-purple-100 hover:opacity-20 rounded-full transition-all ${currentMediaIndex >= mediaFiles.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-90'}`}
                  aria-label="Next media"
                >
                  <FaChevronRight size={32} />
                </button>
              </div>

              {/* Media content */}
              <div className="flex items-center justify-center max-h-[90vh]">
                {mediaFiles[currentMediaIndex]?.type.includes('image') && (
                  <img
                    src={mediaBlobUrl}
                    alt="preview"
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                )}
                {mediaFiles[currentMediaIndex]?.type.includes('video') && (
                  <video
                    controls
                    src={mediaBlobUrl}
                    className="max-w-full max-h-[80vh]"
                  />
                )}
                {(mediaFiles[currentMediaIndex]?.type.includes('msword') ||
                  mediaFiles[currentMediaIndex]?.type.includes('officedocument')) && (
                    <div className="text-white text-center">
                      <p className="mb-4">This document type cannot be previewed.</p>
                      <a
                        href={mediaBlobUrl}
                        download={mediaFiles[currentMediaIndex]?.name}
                        className="text-blue-400 underline"
                      >
                        Click to download
                      </a>
                    </div>
                  )}
                {mediaFiles[currentMediaIndex]?.type === 'application/pdf' && (
                  <iframe
                    src={mediaBlobUrl}
                    title="PDF Viewer"
                    className="w-full h-[80vh] border-0"
                  />
                )}
              </div>

              {/* index indicator */}
              <div className="text-white text-center mt-2">
                {currentMediaIndex + 1} / {mediaFiles.length}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className='flex items-center justify-between w-full'>
            <div className="md:hidden pt-[9px] pr-3">
              <button
                className="text-indigo-600 hover:text-indigo-800 transition-colors text-sm font-medium"
                onClick={() => navigate(-1)}
              >
                <FaChevronLeft className="text-sm" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <form onSubmit={handleNameSave} className="flex gap-2 items-center">
                  <input
                    value={spaceName}
                    onChange={e => setSpaceName(e.target.value)}
                    className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all w-full max-w-md"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <motion.h1
                  whileHover={{ scale: 1.01 }}
                  className="text-2xl md:text-3xl font-semibold flex items-center gap-2"
                >
                  {spaceName}
                  <FaPencilAlt
                    className="cursor-pointer text-indigo-500 hover:text-indigo-700 transition-colors"
                    onClick={() => setIsEditing(true)}
                  />
                </motion.h1>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-700 focus:outline-none"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:flex-none md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-150 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <FaTimes className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
                aria-label="Sort options"
              >
                {sortMode.order === 'asc' ? (
                  <FaSortAmountDownAlt className="text-gray-700 dark:text-gray-300" />
                ) : (
                  <FaSortAmountUpAlt className="text-gray-700 dark:text-gray-300" />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:inline">Sort</span>
                <FaChevronDown className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showSortMenu ? 'transform rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute border border-purple-100 right-0 mt-2 w-56  bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-20 overflow-hidden"
                  >
                    <div className="py-1">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        View Mode
                      </div>
                      <button
                        onClick={() => {
                          setViewMode('card');
                          setShowSortMenu(false);
                        }}
                        className={`flex items-center w-full px-3 py-2 text-sm ${viewMode === 'card' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        <FaThLarge className="mr-2 h-4 w-4" />
                        Card View
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('list');
                          setShowSortMenu(false);
                        }}
                        className={`flex items-center w-full px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        <FaList className="mr-2 h-4 w-4" />
                        List View
                      </button>

                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sort By
                      </div>
                      <button
                        onClick={() => {
                          setSortMode({
                            by: 'name',
                            order: sortMode.by === 'name' ? (sortMode.order === 'asc' ? 'desc' : 'asc') : 'asc'
                          });
                          setShowSortMenu(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 text-sm ${sortMode.by === 'name' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        <div className="flex items-center">
                          <FaFont className="mr-2 h-4 w-4" />
                          Name
                        </div>
                        {sortMode.by === 'name' && (
                          sortMode.order === 'asc' ? <FaArrowUp className="h-3 w-3" /> : <FaArrowDown className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSortMode({
                            by: 'date',
                            order: sortMode.by === 'date' ? (sortMode.order === 'asc' ? 'desc' : 'asc') : 'asc'
                          });
                          setShowSortMenu(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 text-sm ${sortMode.by === 'date' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 h-4 w-4" />
                          Date
                        </div>
                        {sortMode.by === 'date' && (
                          sortMode.order === 'asc' ? <FaArrowUp className="h-3 w-3" /> : <FaArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Note Editor Modal */}
        <AnimatePresence>
          {showNoteEditor && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 backdrop-blur-md bg-black/30 flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="bg-white/70 backdrop-blur-lg rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20"
              >
                {/* Header */}
                <div className="p-5 border-b border-white/20 flex justify-between items-center bg-white/30 backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-gray-800">📝 Create New Note</h3>
                  <button
                    onClick={() => setShowNoteEditor(false)}
                    className="text-gray-600 hover:text-gray-800 transition"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                {/* Editor Body */}
                <div className="p-5 overflow-auto flex-1 space-y-4 custom-scroll border border-purple-100">
                  <input
                    type="text"
                    placeholder="Note title"
                    value={noteName}
                    onChange={(e) => setNoteName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />

                  {/* Editor with Toolbar */}
                  <div className="relative bg-white rounded-lg border border-purple-200 shadow-inner p-4 pb-[50px] h-[400px] overflow-y-auto custom-scroll">
                    {editor && (
                      <>
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-2 mb-4 sticky top-0 z-10 bg-purple-50/80 backdrop-blur-sm border-b p-2 rounded-md shadow-sm border-purple-300">

                          {/* Text formatting */}
                          <button onClick={() => editor.chain().focus().toggleBold().run()} className={buttonStyle(editor.isActive('bold'))}>B</button>
                          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonStyle(editor.isActive('italic'))}>I</button>
                          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={buttonStyle(editor.isActive('underline'))}>U</button>
                          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={buttonStyle(editor.isActive('strike'))}><s>S</s></button>
                          <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={buttonStyle(editor.isActive('highlight'))}>H</button>

                          {/* Headings */}
                          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={buttonStyle(editor.isActive('heading', { level: 1 }))}>H1</button>
                          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={buttonStyle(editor.isActive('heading', { level: 2 }))}>H2</button>

                          {/* Lists */}
                          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonStyle(editor.isActive('bulletList'))}>• List</button>
                          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={buttonStyle(editor.isActive('orderedList'))}>1. List</button>

                          {/* Code Block */}
                          <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={buttonStyle(editor.isActive('codeBlock'))}>{'</>'}</button>

                          {/* Table */}
                          <button onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()} className={buttonStyle()} >📋 Table</button>
                          {/* Table controls */}
                          {editor && (
                            <BubbleMenu
                              editor={editor}
                              shouldShow={({ editor }) => editor.isActive('table')}
                              tippyOptions={{ duration: 100 }}
                              className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
                            >
                              {/* Column Controls */}
                              <button
                                onClick={() => editor.chain().focus().addColumnBefore().run()}
                                className={buttonStyle()}
                                title="Add Column Before"
                              >
                                <FaArrowLeft />
                              </button>
                              <button
                                onClick={() => editor.chain().focus().addColumnAfter().run()}
                                className={buttonStyle()}
                                title="Add Column After"
                              >
                                <FaArrowRight />
                              </button>
                              <button
                                onClick={() => editor.chain().focus().deleteColumn().run()}
                                className={buttonStyle()}
                                title="Delete Column"
                              >
                                <FaTimes />
                              </button>

                              {/* Row Controls */}
                              <button
                                onClick={() => editor.chain().focus().addRowBefore().run()}
                                className={buttonStyle()}
                                title="Add Row Above"
                              >
                                <FaArrowUp />
                              </button>
                              <button
                                onClick={() => editor.chain().focus().addRowAfter().run()}
                                className={buttonStyle()}
                                title="Add Row Below"
                              >
                                <FaArrowDown />
                              </button>
                              <button
                                onClick={() => editor.chain().focus().deleteRow().run()}
                                className={buttonStyle()}
                                title="Delete Row"
                              >
                                <FaTimes />
                              </button>

                              {/* Delete Table */}
                              <button
                                onClick={() => editor.chain().focus().deleteTable().run()}
                                title="Delete Table"
                                className={buttonStyle()}
                              >
                                <FaTrash />
                              </button>
                            </BubbleMenu>
                          )}

                          {/* Undo / Redo */}
                          <button onClick={() => editor.chain().focus().undo().run()} className={buttonStyle()}><FaUndoAlt /></button>
                          <button onClick={() => editor.chain().focus().redo().run()} className={buttonStyle()}><FaRedoAlt /></button>

                          {/* Image Upload */}
                          <label className="cursor-pointer flex items-center gap-1 text-gray-600 hover:text-indigo-600">
                            <FaImage />
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          </label>

                          {/* Copy */}
                          <button onClick={handleCopy} className={buttonStyle()}>
                            <FaRegCopy />
                            {copied && <span className="ml-1 text-xs text-green-500 animate-pulse">Copied!</span>}
                          </button>

                          {/* Scroll to Bottom */}
                          <button onClick={() => editor.view.dom.scrollTop = editor.view.dom.scrollHeight} className={buttonStyle()}>🔽 Bottom</button>

                          {/* Highlight All / Select All */}
                          <button onClick={() => {
                            const total = editor.state.doc.content.size;
                            editor.chain().focus().setTextSelection({ from: 1, to: total }).run();
                          }} className={buttonStyle()}>🖍️ All</button>
                        </div>

                        {/* Content Area */}
                        <EditorContent
                          editor={editor}
                          className="w-full h-full pb-20 outline-none border-purple-300"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/20 flex justify-end gap-3 bg-white/30 backdrop-blur-sm">
                  <button
                    onClick={() => setShowNoteEditor(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNote}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow"
                  >
                    Save Note
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Upload Input */}
        <input
          id="upload-input"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
          accept={folder.type === 'note' ? 'text/*' :
            folder.type === 'image' ? 'image/*' :
              folder.type === 'audio' ? 'audio/*' :
                folder.type === 'video' ? 'video/*' :
                  folder.type === 'document' ? '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx' : '*'}
        />

        {/* Upload Queue */}
        <AnimatePresence>
          {uploadQueue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-4 bg-white shadow rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Upload Queue ({uploadQueue.length})</h3>
                <button
                  type="button"
                  onClick={submitUploads}
                  disabled={uploadQueue.some(u => u.error)}
                  className={`px-4 py-2 rounded-lg ${uploadQueue.some(u => u.error) ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'} transition-colors`}
                >
                  Upload All
                </button>
              </div>

              <div className="space-y-2">
                {uploadQueue.map((u, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg flex items-center justify-between ${u.error ? 'bg-red-50 text-red-600' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      {getFileIcon(u.file.type)}
                      <span className="truncate">{u.file.name}</span>
                      {u.error && (
                        <span className="text-xs">(Invalid file type for this space)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {u.progress > 0 && (
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${u.progress}%` }}
                          ></div>
                        </div>
                      )}
                      <button
                        onClick={() => removeFromUploadQueue(i)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Listing */}
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <FaFolder className="text-5xl text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">No files found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {folder.type === 'note' ? 'Create your first note or upload text files' :
                `Upload ${folder.type} files to get started`}
            </p>
            {folder.type === 'note' ? (
              <button
                onClick={() => setShowNoteEditor(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Note
              </button>
            ) : (
              <button
                onClick={() => document.getElementById('upload-input').click()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Upload Files
              </button>
            )}
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFiles.map(file => (
              <motion.div
                key={file.id}
                ref={el => (fileRefs.current[file.id] = el)}
                whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                className="p-5 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col transition-all duration-200 w-[auto] md:w-[260px]"
              >
                {/* File Header with Icon and Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-semibold truncate max-w-[140px]" title={file.name}>
                      {file.name.length > 24 ? file.name.slice(0, 21) + '...' : file.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate max-w-[120px]" title={formatFileSize(file.size || 0) + (file.duration || '')}>
                      {formatFileSize(file.size || 0)}{file.duration && file.duration.length > 10 ? file.duration.slice(0, 9) + '...' : file.duration}
                    </p>
                  </div>
                  {file.pinned && (
                    <FaThumbtack className="text-indigo-500 text-sm" />
                  )}
                </div>

                {/* File Preview Section */}
                {file.type.includes('image') && (
                  <div className="mb-3 rounded overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center h-32">
                    <FileImagePreview file={file} onClick={() => handleFileAction(file, 'view')} />
                  </div>
                )}

                {file.type.includes('audio') && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-700">
                    {/* Audio Player */}
                    <div className="flex items-center gap-3">
                      {/* Progress Bar */}
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${currentAudio === file.id ? audioProgress : 0}%` }}
                        />
                      </div>

                      {/* Play/Pause Button */}
                      <button
                        onClick={() => handlePlayAudio(file)}
                        className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${currentAudio === file.id
                          ? 'bg-indigo-700 dark:bg-indigo-600 hover:bg-indigo-800 shadow-md'
                          : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700'
                          }`}
                        aria-label={currentAudio === file.id ? 'Pause audio' : 'Play audio'}
                      >
                        {currentAudio === file.id ? (
                          <FaPause className="text-white text-xs" />
                        ) : (
                          <FaPlay className="text-white text-xs ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Lyrics Section */}
                    {showLyricsInput === file.id ? (
                      <div className="mt-3 animate-fadeIn">
                        <textarea
                          value={lyrics}
                          onChange={(e) => setLyrics(e.target.value)}
                          placeholder="Enter lyrics (separate lines with blank lines for paragraphs)..."
                          className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200 transition-all"
                          rows={4}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setShowLyricsInput(null)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleFileAction(file, 'add-lyrics')}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 flex items-center gap-1.5 transition-colors"
                          >
                            <FaCheck size={10} />
                            Save Lyrics
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        {(() => {
                          fetchLyricsForFile(file); // attempt to load on render

                          return fileLyricsMap[file.id] === undefined ? (
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <FaSpinner className="animate-spin" size={12} />
                              <span>Checking for lyrics...</span>
                            </div>
                          ) : fileLyricsMap[file.id] ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                                <FaMusic size={10} />
                                <span>Lyrics available</span>
                              </div>
                              <button
                                onClick={() => setShowLyricsInput(file.id)}
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
                              >
                                <FaEdit size={10} />
                                <span>Edit</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowLyricsInput(file.id)}
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 mt-1 group"
                            >
                              <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-gray-600 transition-colors">
                                <FaPlus size={8} className="text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <span>Add Lyrics</span>
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {file.type.includes('video') && (
                  <div className="mb-3 rounded overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center h-32 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FaVideo className="text-gray-400 text-3xl" />
                    </div>
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 cursor-pointer"
                      onClick={() => handleFileAction(file, 'view')}
                    >
                      <FaPlay className="text-white text-2xl" />
                    </div>
                  </div>
                )}

                {(file.type.includes('pdf') || file.type.includes('document')) && (
                  <div className="mb-3 rounded overflow-hidden bg-gray-100 flex items-center justify-center h-32">
                    <div className="text-center p-4">
                      {file.type.includes('pdf') ? (
                        <FaFilePdf className="text-red-500 text-4xl mx-auto mb-2" />
                      ) : (
                        <FaFileWord className="text-blue-500 text-4xl mx-auto mb-2" />
                      )}
                      <span className="text-xs text-gray-600 block truncate max-w-[120px]" title={file.name}>
                        {file.name.length > 24 ? file.name.slice(0, 21) + '...' : file.name}
                      </span>
                      <span className="text-xs text-gray-500 block truncate max-w-[100px]" title={formatFileSize(file.size || 0)}>
                        {formatFileSize(file.size || 0)}
                      </span>
                      <span className="text-xs text-gray-400 block truncate max-w-[100px]" title={new Date(file.uploaded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}>
                        {new Date(file.uploaded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                )}

                {/* File Metadata */}
                <div className="text-left text-sm mb-4 space-y-1.5">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <FaCalendarAlt className="mr-2 text-gray-400 dark:text-gray-500 text-xs" />
                    <span>Uploaded: {new Date(file.uploaded_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <FaFileAlt className="mr-2 text-gray-400 dark:text-gray-500 text-xs" />
                    <span className="capitalize truncate max-w-[80px]" title={file.type.split('/')[1] || file.type}>
                      {(file.type.split('/')[1] || file.type).length > 16 ? (file.type.split('/')[1] || file.type).slice(0, 13) + '...' : (file.type.split('/')[1] || file.type)}
                    </span>
                    {file.size && (
                      <span className="ml-3 text-gray-500 dark:text-gray-400 text-xs">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                </div>

                {/* File Actions */}
                <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleFileAction(file, 'download')}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                    title="Download"
                    aria-label="Download file"
                  >
                    <FaDownload size={12} />
                    <span>Download</span>
                  </button>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleFileAction(file, 'view')}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors relative group"
                      title={file.type.startsWith('audio/') ? 'View Lyrics' : 'View'}
                      aria-label={file.type.startsWith('audio/') ? 'View lyrics' : 'View file'}
                    >
                      {file.type.startsWith('audio/') ? (
                        <>
                          <FaMusic size={12} />
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            View Lyrics
                          </span>
                        </>
                      ) : (
                        <>
                          <FaRegEye size={12} />
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            Preview
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleFileAction(file, 'share')}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors relative group"
                      title="Share"
                      aria-label="Share file"
                    >
                      <FaShareAlt size={12} />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        Share
                      </span>
                    </button>

                    <button
                      onClick={() => handleFileAction(file, 'pin')}
                      className={`p-2 rounded-lg transition-colors relative group ${file.pinned
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                        : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                        }`}
                      title={file.pinned ? 'Unpin' : 'Pin'}
                      aria-label={file.pinned ? 'Unpin file' : 'Pin file'}
                    >
                      <FaThumbtack size={12} className={file.pinned ? '' : 'transform -rotate-45'} />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.pinned ? 'Unpin' : 'Pin'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleFileAction(file, 'delete')}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors relative group"
                      title="Delete"
                      aria-label="Delete file"
                    >
                      <FaTrashAlt size={12} />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        Delete
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className='overflow-x-auto w-full'>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Uploaded
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFiles.map(file => (
                  <motion.tr
                    key={file.id}
                    ref={el => (fileRefs.current[file.id] = el)}
                    whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
                    className="transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center min-w-0">
    <div className="flex-shrink-0 text-lg mr-3">
      {getFileIcon(file.type)}
    </div>
    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[8rem] sm:max-w-xs md:max-w-full">
      {file.name}
      {file.pinned && (
        <FaThumbtack className="inline-block ml-2 text-indigo-500 text-xs" />
      )}
    </div>
  </div>
</td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {file.type.split('/')[1] || file.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(file.uploaded_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleFileAction(file, 'download')}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Download"
                        >
                          <FaDownload />
                        </button>
                        <button
                          onClick={() => handleFileAction(file, 'view')}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View"
                        >
                          <FaRegEye />
                        </button>
                        <button
                          onClick={() => handleFileAction(file, 'share')}
                          className="text-green-600 hover:text-green-900"
                          title="Share"
                        >
                          <FaShareAlt />
                        </button>
                        <button
                          onClick={() => handleFileAction(file, 'delete')}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FaTrashAlt />
                        </button>
                        <button
                          onClick={() => handleFileAction(file, 'pin')}
                          className={file.pinned ? "text-indigo-600" : "text-gray-600 hover:text-indigo-600"}
                          title={file.pinned ? 'Unpin' : 'Pin'}
                        >
                          <FaThumbtack />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FolderPage;