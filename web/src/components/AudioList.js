// src/components/AudioList.js
import React from 'react';

/**
 * AudioList Component
 * Displays a table of generated audio files with play and download options
 * 
 * @param {Object[]} audioFiles - Array of audio file objects
 * @param {string} audioFiles[].name - File name
 * @param {Blob} audioFiles[].url - Audio blob data
 * @param {string} audioFiles[].prompt - Original text prompt
 * @param {string} audioFiles[].voice - Voice used for generation
 * @param {string} audioFiles[].model - Model used for generation
 * @param {string} audioFiles[].instructions - Instructions/persona used
 * @param {boolean} audioFiles[].checked - Whether the file is selected
 * @param {boolean} audioFiles[].error - Whether there was an error generating this file
 * @param {function} onDownload - Function to handle download action, receives file index
 * @returns {JSX.Element} AudioList component
 */
const AudioList = ({ audioFiles, onDownload }) => {
  return (
    <div>
      <h2 style={{ fontSize: '16px', marginTop: '10px', marginBottom: '10px' }}>Playlist</h2>
      {audioFiles.length === 0 ? (
        <p style={{ fontSize: '13px' }}>No audio files available. Upload an Excel file to begin.</p>
      ) : (
        <table style={{ fontSize: '13px' }}>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Voice</th>
              <th>Model</th>
              <th>Prompt Text</th>
              <th>Instructions</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {audioFiles.map((file, index) => (
              <tr key={index} className={file.error ? 'error-row' : ''}>
                <td>{file.name}</td>
                <td>{file.voice || 'N/A'}</td>
                <td>{file.model || 'N/A'}</td>
                <td style={{ maxWidth: '200px', wordWrap: 'break-word' }}>{file.prompt}</td>
                <td style={{ maxWidth: '150px', wordWrap: 'break-word' }}>{file.instructions || 'None'}</td>
                <td>
                  {file.url && (
                    <button onClick={() => playAudio(file)} style={{padding: '4px 8px', fontSize: '12px', marginRight: '2px'}}>Play</button>
                  )}
                  {file.url && (
                    <button onClick={() => onDownload(index)} style={{padding: '4px 8px', fontSize: '12px'}}>Download</button>
                  )}
                  {!file.error && (
                    <input
                      type="checkbox"
                      id={`checkbox-${index}`}
                      checked={file.checked} // Bind the checked state to the file's checked property
                      onChange={(e) => {
                        // Dispatch an event to notify about check state change
                        const event = new CustomEvent('fileCheckChanged', {
                          detail: { index, checked: e.target.checked }
                        });
                        window.dispatchEvent(event);
                      }}
                    />
                  )}
                  {file.error && (
                    <span className="error-badge">Error</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

/**
 * Plays an audio file using the Audio API
 * 
 * @param {Object} file - The audio file object
 * @param {Blob} file.url - The audio blob to play
 */
const playAudio = (file) => {
  // Only play if we have a valid URL
  if (file.url) {
    const audio = new Audio(URL.createObjectURL(file.url));
    audio.play();
  } else {
    alert('No audio available for this file yet.');
  }
};

export default AudioList;