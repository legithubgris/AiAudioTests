import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './App.css';

interface AudioFile {
  id: string;
  filename: string;
  promptText: string;
  instructions: string;
  voice: string;
  model: string;
  filePath: string | null;
  size: number;
  status: 'completed' | 'error';
  error?: string;
}

interface Playlist {
  id: string;
  name: string;
  files: AudioFile[];
  createdAt: string;
}

const SUPPORTED_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'ash', 'sage', 'coral'];
const SUPPORTED_MODELS = ['gpt-4o-mini-tts', 'tts-1', 'tts-1-hd'];

function App() {
  const [apiKey, setApiKey] = useState('');
  const [apiKeySet, setApiKeySet] = useState(false);
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [model, setModel] = useState('gpt-4o-mini-tts');
  const [instructions, setInstructions] = useState('');
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingFileId, setPlayingFileId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001';

  // Clear cache on component mount
  React.useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  const setApiKeyHandler = async () => {
    if (!apiKey || !apiKey.startsWith('sk-')) {
      setMessage('Please enter a valid OpenAI API key (starts with sk-)');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/tts/set-api-key`, { apiKey });
      setApiKeySet(true);
      setMessage('API key set successfully!');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to set API key');
    } finally {
      setLoading(false);
    }
  };

  const generateSingleAudio = async () => {
    if (!text.trim()) {
      setMessage('Please enter some text to generate audio');
      return;
    }

    try {
      setLoading(true);
      setMessage('Generating audio...');
      
      const response = await axios.post(`${API_BASE}/api/tts/generate-single`, {
        text: text.trim(),
        voice,
        model,
        instructions: instructions.trim()
      }, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audio_${Date.now()}.mp3`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setMessage('Audio generated and downloaded successfully!');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to generate audio');
    } finally {
      setLoading(false);
    }
  };

  const processExcelFile = async (file: File) => {
    try {
      setLoading(true);
      setMessage('Processing Excel file...');
      
      const formData = new FormData();
      formData.append('excelFile', file);
      
      const response = await axios.post(`${API_BASE}/api/tts/process-excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setPlaylist(response.data.playlist);
      setSelectedFiles(new Set());
      setMessage(`Processed ${response.data.playlist.files.length} items from Excel file`);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to process Excel file');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    if (!playlist) return;
    
    const completedFiles = playlist.files.filter(f => f.status === 'completed');
    const allSelected = completedFiles.every(f => selectedFiles.has(f.id));
    
    if (allSelected) {
      // Unselect all
      setSelectedFiles(new Set());
    } else {
      // Select all completed files
      setSelectedFiles(new Set(completedFiles.map(f => f.id)));
    }
  };

  const downloadFile = async (file: AudioFile) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/files/download/${playlist?.id}/${file.id}?filename=${file.filename}`,
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      saveAs(blob, file.filename);
    } catch (error) {
      setMessage('Failed to download file');
    }
  };

  const downloadSelectedFiles = async () => {
    if (!playlist || selectedFiles.size === 0) return;
    
    try {
      setLoading(true);
      setMessage('Creating ZIP file...');
      
      const selectedFileData = playlist.files.filter(f => 
        selectedFiles.has(f.id) && f.status === 'completed'
      );
      
      const zip = new JSZip();
      
      // Download each file and add to ZIP
      for (const file of selectedFileData) {
        try {
          const response = await axios.get(
            `${API_BASE}/api/files/download/${playlist.id}/${file.id}?filename=${file.filename}`,
            { responseType: 'blob' }
          );
          zip.file(file.filename, response.data);
        } catch (error) {
          console.error(`Failed to download ${file.filename}:`, error);
        }
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `playlist_${playlist.name}_${Date.now()}.zip`);
      
      setMessage(`Downloaded ${selectedFileData.length} files as ZIP`);
    } catch (error) {
      setMessage('Failed to create ZIP file');
    } finally {
      setLoading(false);
    }
  };

  const clearFiles = async () => {
    if (!playlist) return;
    
    const hasSelectedFiles = selectedFiles.size > 0;
    
    if (hasSelectedFiles) {
      // Clear only selected files
      const remainingFiles = playlist.files.filter(f => !selectedFiles.has(f.id));
      setPlaylist({ ...playlist, files: remainingFiles });
      setSelectedFiles(new Set());
      setMessage(`Cleared ${selectedFiles.size} selected files`);
    } else {
      // Clear entire playlist
      try {
        await axios.delete(`${API_BASE}/api/tts/playlist/${playlist.id}`);
        setPlaylist(null);
        setSelectedFiles(new Set());
        setMessage('Playlist cleared successfully');
      } catch (error) {
        setMessage('Failed to clear playlist');
      }
    }
  };

  const playAudio = useCallback((file: AudioFile) => {
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setPlayingFileId(null);
    }

    if (playingFileId === file.id) {
      return; // Just stop if clicking the same file
    }

    // Create new audio element
    const audio = new Audio(`${API_BASE}/api/files/stream/${playlist?.id}/${file.id}?filename=${file.filename}`);
    
    audio.addEventListener('ended', () => {
      setCurrentAudio(null);
      setPlayingFileId(null);
    });

    audio.addEventListener('error', () => {
      setMessage('Failed to play audio file');
      setCurrentAudio(null);
      setPlayingFileId(null);
    });

    audio.play().catch(() => {
      setMessage('Failed to play audio file');
    });

    setCurrentAudio(audio);
    setPlayingFileId(file.id);
  }, [currentAudio, playingFileId, playlist?.id, API_BASE]);

  const getButtonText = () => {
    if (!playlist || playlist.files.length === 0) return 'No files';
    
    const completedFiles = playlist.files.filter(f => f.status === 'completed');
    const allSelected = completedFiles.length > 0 && completedFiles.every(f => selectedFiles.has(f.id));
    
    return allSelected ? 'Unselect All' : 'Select All';
  };

  const getClearButtonText = () => {
    return selectedFiles.size > 0 ? 'Clear Selected Files' : 'Clear Playlist';
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Text-to-Speech Generator
          </h1>
          <p className="text-gray-600">
            Generate audio from text or Excel files using OpenAI's TTS API
          </p>
        </header>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') || message.includes('Failed') 
            ? 'bg-red-100 text-red-700 border border-red-300' 
            : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
            {message}
          </div>
        )}

        {/* API Key Section */}
        {!apiKeySet && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Setup</h2>
            <div className="flex gap-4">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key (sk-...)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={setApiKeyHandler}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Setting...' : 'Set API Key'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Your API key is required for generating audio and is never stored.
            </p>
          </div>
        )}

        {apiKeySet && (
          <>
            {/* Single Text Generation */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Generate Single Audio</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice
                  </label>
                  <select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {SUPPORTED_VOICES.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {SUPPORTED_MODELS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g., Speak in a cheerful tone"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text to Generate
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text you want to convert to speech..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={generateSingleAudio}
                disabled={loading || !text.trim()}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Audio from Prompt'}
              </button>
            </div>

            {/* Excel Upload */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Upload Excel File</h2>
              <p className="text-gray-600 mb-4">
                Upload an Excel file with columns: Prompt Text (A), Instructions (B), Model (C), Voice (D), Instructions (E)
              </p>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Playlist */}
            {playlist && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    Playlist: {playlist.name} ({playlist.files.length} files)
                  </h2>
                </div>

                {/* Playlist Controls */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    onClick={selectAllFiles}
                    disabled={playlist.files.filter(f => f.status === 'completed').length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {getButtonText()}
                  </button>
                  
                  <button
                    onClick={downloadSelectedFiles}
                    disabled={selectedFiles.size === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Download Selected ({selectedFiles.size})
                  </button>
                  
                  <button
                    onClick={clearFiles}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    {getClearButtonText()}
                  </button>
                </div>

                {/* File List */}
                <div className="space-y-3">
                  {playlist.files.map((file) => (
                    <div
                      key={file.id}
                      className={`p-4 border rounded-lg ${
                        file.status === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {file.filename}
                            </h3>
                            {file.status === 'error' && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                Error
                              </span>
                            )}
                            {file.status === 'completed' && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                Ready
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>Text:</strong> {file.promptText}
                          </div>
                          
                          {file.instructions && (
                            <div className="text-sm text-gray-600 mb-1">
                              <strong>Instructions:</strong> {file.instructions}
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500">
                            Voice: {file.voice} | Model: {file.model}
                            {file.size > 0 && ` | Size: ${(file.size / 1024).toFixed(1)} KB`}
                          </div>
                          
                          {file.error && (
                            <div className="text-sm text-red-600 mt-1">
                              Error: {file.error}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {file.status === 'completed' && (
                            <>
                              <button
                                onClick={() => playAudio(file)}
                                className={`p-2 rounded-lg ${
                                  playingFileId === file.id
                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                }`}
                                title={playingFileId === file.id ? 'Stop' : 'Play'}
                              >
                                {playingFileId === file.id ? '⏹️' : '▶️'}
                              </button>
                              
                              <button
                                onClick={() => downloadFile(file)}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                                title="Download"
                              >
                                ⬇️
                              </button>
                              
                              <input
                                type="checkbox"
                                checked={selectedFiles.has(file.id)}
                                onChange={() => toggleFileSelection(file.id)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
