// src/App.js
import React, { useState, useEffect } from 'react';
import { parseXlsx } from './utils';  // Import parseXlsx from utils.js
import AudioList from './components/AudioList';
import Header from './components/Header';
import Footer from './components/Footer';
import TtsForm from './components/TtsForm';
import ApiKeyInput from './components/ApiKeyInput';
import OpenAI from 'openai';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * OpenAI API Key from environment variables
 * @type {string}
 */
const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

/**
 * Validates if a given API key has the correct format
 * @param {string} key - The API key to validate
 * @returns {boolean} - True if the key is valid, false otherwise
 */
const isValidApiKey = (key) => {
  return key && typeof key === 'string' && key.startsWith('sk-') && key.length > 20;
};

// Initialize with stored API key if available
const storedApiKey = localStorage.getItem('openai_api_key') || apiKey;

/**
 * Initialize OpenAI client - will be re-initialized when API key changes
 */
let openai = new OpenAI({
  apiKey: storedApiKey,
  dangerouslyAllowBrowser: true // Required for browser usage
});

/**
 * Main application component
 * Handles text-to-speech generation, excel file processing, and audio file management
 */
const App = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(storedApiKey || '');
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });

  // Listen for changes to file checkboxes
  useEffect(() => {
    const handleFileCheckChanged = (event) => {
      const { index, checked } = event.detail;
      setAudioFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = { ...newFiles[index], checked };
        return newFiles;
      });
    };

    window.addEventListener('fileCheckChanged', handleFileCheckChanged);
    return () => {
      window.removeEventListener('fileCheckChanged', handleFileCheckChanged);
    };
  }, []);
  
  // Clear cache data from other sessions when the service restarts
  useEffect(() => {
    const clearCacheOnRestart = () => {
      // Clear any stored audio file references
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('audio_') || key.startsWith('tts_cache_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear any sessionStorage as well
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.startsWith('audio_') || key.startsWith('tts_cache_')) {
          sessionStorage.removeItem(key);
        }
      });
      
      console.log('Cache data from previous sessions cleared');
    };

    // Clear cache on component mount (service restart)
    clearCacheOnRestart();
  }, []); // Empty dependency array means this runs once on mount
  
  // Effect to handle API key changes
  useEffect(() => {
    if (apiKey) {
      // Save to localStorage
      localStorage.setItem('openai_api_key', apiKey);
      
      // Re-initialize OpenAI client with new key
      openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
    }
  }, [apiKey]);

  /**
   * Handles audio generation from text prompt using OpenAI API
   * @param {string} prompt - The text prompt to convert to audio
   * @param {string} persona - The persona or style for the speech (optional)
   * @param {string} voice - The voice model to use for speech synthesis
   */
  const handleGenerateAudio = async (prompt, persona, voice) => {
    if (!prompt.trim()) {
      setError("Please enter a prompt text");
      return;
    }

    // First check if API key is available and valid
    if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 20) {
      setError("Please enter a valid OpenAI API key. It should start with 'sk-'");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`Generating audio for prompt: "${prompt}" with voice: ${voice}`);
      
      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: prompt,
        instructions: persona || undefined,
      });
      
      const audioBlob = await response.blob();
      const fileName = `${prompt.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
      
      console.log(`Successfully generated audio: ${fileName}`);
      
      setAudioFiles(prev => [
        ...prev, 
        {
          name: fileName,
          url: audioBlob,
          prompt: prompt,
          checked: false
        }
      ]);
    } catch (err) {
      console.error('Error generating speech:', err);
      
      // More specific error messages based on the error
      if (err.message && err.message.includes('API key')) {
        setError(`API key error: ${err.message}. Check your .env file.`);
      } else if (err.status === 429) {
        setError("Rate limit exceeded. Please try again later.");
      } else {
        setError(`Failed to generate audio: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles bulk upload and processing of audio files from selected Excel files
   * Uses chunking for better performance with large files
   * @param {FileList} files - The list of Excel files to upload and process
   */
  const handleUploadFiles = async (files) => {
    setLoading(true);
    setError(null);
    setProcessingProgress({ current: 0, total: 0 });
    
    // First check if API key is available and valid
    if (!isValidApiKey(apiKey)) {
      setError("OpenAI API key is missing or invalid. Check your .env file.");
      setLoading(false);
      return;
    }
    
    // Track successes and failures
    let successCount = 0;
    let failureCount = 0;
    let totalRowsToProcess = 0;
    
    // First, calculate total rows across all files for accurate progress tracking
    for (const file of files) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        try {
          const data = await parseXlsx(file);
          if (data && data.length > 0) {
            // Skip header row if it exists
            const startRow = data[0] && typeof data[0][0] === 'string' && 
                         (data[0][0].toLowerCase().includes('prompt') || 
                          data[0][0].toLowerCase().includes('text')) ? 1 : 0;
            totalRowsToProcess += (data.length - startRow);
          }
        } catch (err) {
          console.error('Error parsing XLSX file during count:', err);
        }
      }
    }
    
    // Set the total for progress tracking
    setProcessingProgress({ current: 0, total: totalRowsToProcess });
    
    // Process each file
    for (const file of files) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        try {
          console.log(`Processing Excel file: ${file.name}`);
          const data = await parseXlsx(file);

          if (!data || data.length === 0) {
            setError(`File "${file.name}" appears to be empty.`);
            continue;
          }

          console.log(`Parsed data from file ${file.name}:`, data);

          // Skip header row if it exists
          const startRow = 0; // Headers are already handled in parseXlsx

          console.log(`Starting processing from row ${startRow + 1}`);

          // Process data in chunks to prevent UI freezing with large files
          const CHUNK_SIZE = 5; // Process 5 rows at a time

          for (let i = startRow; i < data.length; i += CHUNK_SIZE) {
            const chunk = data.slice(i, i + CHUNK_SIZE);
            console.log(`Processing chunk:`, chunk);

            for (const [rowIndex, rowData] of chunk.entries()) {
              const rowNumber = i + rowIndex + 1;
              await processRow(rowIndex, rowData, rowNumber, openai);
            }
          }
        } catch (err) {
          console.error(`Error processing file ${file.name}:`, err);
          setError(`Failed to process file "${file.name}": ${err.message || 'Unknown error'}`);
        }
      } else {
        setError(`File "${file.name}" is not a valid Excel file.`);
      }
    }
    
    // Show a summary message
    if (successCount > 0 && failureCount === 0) {
      setError(null); // Clear any previous errors
      console.log(`All ${successCount} audio files generated successfully!`);
    } else if (successCount > 0 && failureCount > 0) {
      setError(`Generated ${successCount} files successfully, but ${failureCount} failed. Check the list for details.`);
    } else if (successCount === 0 && failureCount > 0) {
      setError(`Failed to generate any audio files. Check the console for details.`);
    }
    
    setLoading(false);
    setProcessingProgress({ current: 0, total: 0 }); // Reset progress
  };

  /**
   * Handles downloading of a single audio file
   * @param {number} index - The index of the audio file in the list
   */
  const handleDownload = (index) => {
    const file = audioFiles[index];
    if (file && file.url) {
      try {
        const url = URL.createObjectURL(file.url);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`Downloaded file: ${file.name}`);
      } catch (err) {
        console.error('Error downloading file:', err);
        setError(`Failed to download file: ${err.message}`);
      }
    } else if (file) {
      setError(`Cannot download "${file.name}" - no audio data available`);
    }
  };

  // Add "Check All" and "Uncheck All" buttons functionality with dynamic text
  const areAllSelected = audioFiles.length > 0 && audioFiles.every(file => file.checked);
  
  const toggleSelectAll = () => {
    if (areAllSelected) {
      // If all are selected, unselect all
      setAudioFiles(prev => prev.map(file => ({ ...file, checked: false })));
    } else {
      // If some or none are selected, select all
      setAudioFiles(prev => prev.map(file => ({ ...file, checked: true })));
    }
  };

  /**
   * Clears the entire playlist and releases all blob URLs to free memory
   */
  const clearPlaylist = () => {
    // Release all blob URLs to prevent memory leaks
    audioFiles.forEach(file => {
      if (file.url && typeof file.url === 'object') {
        URL.revokeObjectURL(URL.createObjectURL(file.url));
      }
    });
    
    // Clear the audio files array
    setAudioFiles([]);
    setError(null);
    console.log('Playlist cleared and memory released');
  };

  /**
   * Clears only the selected files from the playlist
   */
  const clearSelectedFiles = () => {
    const selectedIndexes = audioFiles
      .map((file, index) => file.checked ? index : -1)
      .filter(index => index !== -1);
    
    if (selectedIndexes.length === 0) {
      alert('No files selected for removal.');
      return;
    }
    
    // Release blob URLs for selected files to prevent memory leaks
    selectedIndexes.forEach(index => {
      const file = audioFiles[index];
      if (file.url && typeof file.url === 'object') {
        URL.revokeObjectURL(URL.createObjectURL(file.url));
      }
    });
    
    // Remove selected files from the array
    setAudioFiles(prev => prev.filter((file, index) => !file.checked));
    setError(null);
    console.log(`Removed ${selectedIndexes.length} selected files from playlist`);
  };

  /**
   * Handles bulk downloading of selected audio files
   */
  const handleBulkDownload = async () => {
    const selectedFiles = audioFiles.filter(file => file.checked);

    if (selectedFiles.length === 0) {
      alert('No files selected for download. Please select files or check all to download.');
      return;
    }

    try {
      const zip = new JSZip();

      for (const file of selectedFiles) {
        if (file.url) {
          const response = await fetch(URL.createObjectURL(file.url));
          const blob = await response.blob();
          zip.file(file.name, blob);
        } else {
          console.warn(`File ${file.name} has no URL and will be skipped.`);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'audio_files.zip');
      console.log('ZIP file created and download initiated.');
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      alert('An error occurred while creating the ZIP file. Please try again.');
    }
  };

  // Define the processRow function if missing
  const processRow = async (rowIndex, rowData, rowNumber, openaiClient) => {
    // Support multiple column name variations for flexibility
    const promptText = rowData["Prompt Text"] || rowData["Prompt name"] || rowData["Text"] || rowData["A"] || '';
    let model = rowData["Model"] || rowData["C"] || 'tts-1'; // Default to tts-1
    let voice = rowData["Voice"] || rowData["D"] || 'alloy'; // Use "Voice" column if available
    const instructions = rowData["Instructions"] || rowData["Prop text"] || rowData["E"] || rowData["B"] || ''; // Use "Instructions" column if available

    // Convert to string to handle any data type issues
    const promptString = String(promptText).trim();
    const instructionsString = String(instructions).trim();
    
    if (!promptString) {
      console.warn(`Row ${rowNumber}: No prompt text found, skipping`);
      return { success: false, error: 'No prompt text' };
    }

    // Validate the voice parameter
    const allowedVoices = ['nova', 'shimmer', 'echo', 'onyx', 'fable', 'alloy', 'ballad', 'ash', 'sage', 'coral'];
    if (!allowedVoices.includes(voice.toLowerCase())) {
      console.warn(`Invalid voice '${voice}' for row ${rowNumber}. Falling back to default 'alloy'.`);
      voice = 'alloy';
    }

    // Validate model (OpenAI currently supports tts-1 and tts-1-hd)
    const allowedModels = ['tts-1', 'tts-1-hd'];
    if (!allowedModels.includes(model)) {
      console.warn(`Invalid model '${model}' for row ${rowNumber}. Falling back to default 'tts-1'.`);
      model = 'tts-1';
    }

    try {
      console.log(`Processing row ${rowNumber}: "${promptString.substring(0, 30)}..." with voice "${voice}", model "${model}", instructions: "${instructionsString.substring(0, 30)}..."`);

      const requestData = {
        model: model,
        voice: voice.toLowerCase(),
        input: promptString,
      };

      // Only add instructions if they exist and are not empty
      if (instructionsString && instructionsString.length > 0) {
        requestData.instructions = instructionsString;
      }

      const response = await openaiClient.audio.speech.create(requestData);

      const audioBlob = await response.blob();
      const fileName = `Row${rowNumber}_${promptString.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;

      setAudioFiles(prev => [
        ...prev, 
        {
          name: fileName,
          url: audioBlob,
          prompt: promptString,
          voice: voice,
          model: model,
          instructions: instructionsString,
          checked: false
        }
      ]);

      // Update progress
      setProcessingProgress(prev => ({ ...prev, current: prev.current + 1 }));

      return { success: true };
    } catch (err) {
      console.error(`Error generating speech for row ${rowNumber}:`, err);

      setAudioFiles(prev => [
        ...prev, 
        {
          name: `Error_Row${rowNumber}.mp3`,
          url: null,
          prompt: `Error with "${promptString ? promptString.substring(0, 30) : 'Empty prompt'}...": ${err.message}`,
          voice: voice,
          model: model,
          instructions: instructionsString,
          checked: false,
          error: true
        }
      ]);

      // Update progress even for errors
      setProcessingProgress(prev => ({ ...prev, current: prev.current + 1 }));

      return { success: false, error: err };
    }
  };

  return (
    <div className="App">
      <Header />
      <main>
        <ApiKeyInput 
          initialApiKey={apiKey} 
          onApiKeyChange={setApiKey} 
        />
        
        <TtsForm 
          onGenerateAudio={handleGenerateAudio} 
          onUploadFiles={handleUploadFiles} 
        />
        
        {error && <div className="error-message">{error}</div>}
        
        {loading && (
          <div className="loading-spinner">
            {processingProgress.total > 0 
              ? `Generating audio: ${processingProgress.current} of ${processingProgress.total} items processed` 
              : 'Generating audio...'}
          </div>
        )}
        
        {loading && processingProgress.total > 0 && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
            />
            <div className="progress-text">
              {Math.round((processingProgress.current / processingProgress.total) * 100)}%
            </div>
          </div>
        )}
        
        {audioFiles.length > 0 && (
          <>
            <AudioList audioFiles={audioFiles} onDownload={handleDownload} />
            <div className="bulk-actions">
              <button onClick={toggleSelectAll}>
                {areAllSelected ? 'Unselect All' : 'Select All'}
              </button>
              <button onClick={handleBulkDownload}>
                Download Selected
              </button>
              <button 
                onClick={() => {
                  const hasSelectedFiles = audioFiles.some(file => file.checked);
                  if (hasSelectedFiles) {
                    clearSelectedFiles();
                  } else {
                    clearPlaylist();
                  }
                }}
                className="clear-playlist-btn"
              >
                {audioFiles.some(file => file.checked) ? 'Clear Selected Files' : 'Clear Playlist'}
              </button>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;