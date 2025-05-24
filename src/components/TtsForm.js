// src/components/TtsForm.js
import React, { useState } from 'react';

/**
 * TtsForm Component
 * Provides input forms for text-to-speech generation via direct text input or Excel file upload
 * 
 * @param {function} onGenerateAudio - Callback when generating audio from text
 * @param {function} onUploadFiles - Callback when uploading Excel files
 * @returns {JSX.Element} TtsForm component
 */
const TtsForm = ({ onGenerateAudio, onUploadFiles }) => {
  const [prompt, setPrompt] = useState('');
  const [persona, setPersona] = useState('');
  const [voice, setVoice] = useState('alloy'); // Using a voice that exists in the OpenAI API
  const [files, setFiles] = useState([]);

  /**
   * Handle changes to the prompt text input
   * @param {Object} e - Event object
   */
  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  /**
   * Handle changes to the persona instructions textarea
   * @param {Object} e - Event object
   */
  const handlePersonaChange = (e) => {
    setPersona(e.target.value);
  };

  /**
   * Handle changes to the voice selection dropdown
   * @param {Object} e - Event object
   */
  const handleVoiceChange = (e) => {
    setVoice(e.target.value);
  };

  /**
   * Handle file upload event
   * @param {Object} e - Event object containing selected files
   */
  const handleFileUpload = (e) => {
    setFiles(Array.from(e.target.files));
  };

  /**
   * Handle form submit for text-to-speech generation
   * @param {Object} e - Event object
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerateAudio(prompt, persona, voice);
  };

  /**
   * Handle form submit for Excel file processing
   * @param {Object} e - Event object
   */
  const handleFileSubmit = (e) => {
    e.preventDefault();
    if (files.length > 0) {
      onUploadFiles(files);
    } else {
      alert('Please select at least one Excel file to upload');
    }
  };

  return (
    <div className="tts-form-container">
      <form onSubmit={handleSubmit} className="prompt-form">
        <h3>Generate Audio from Text</h3>
        <div>
          <label htmlFor="prompt">Prompt:</label>
          <input type="text" id="prompt" value={prompt} onChange={handlePromptChange} required />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: '1' }}>
            <label htmlFor="voice">Voice:</label>
            <select id="voice" value={voice} onChange={handleVoiceChange} style={{ height: '32px' }}>
              <option value="alloy">Alloy</option>
              <option value="echo">Echo</option>
              <option value="fable">Fable</option>
              <option value="onyx">Onyx</option>
              <option value="nova">Nova</option>
              <option value="shimmer">Shimmer</option>
            </select>
          </div>
          <div style={{ flex: '2' }}>
            <label htmlFor="persona">Persona (optional):</label>
            <input type="text" id="persona" value={persona} onChange={handlePersonaChange} placeholder="E.g., Speak with enthusiasm" />
          </div>
        </div>
        <div>
          <button type="submit">Generate Audio from Prompt</button>
        </div>
      </form>

      <form onSubmit={handleFileSubmit} className="file-upload-form">
        <h3>Generate Audio from Excel</h3>
        <div>
          <label htmlFor="files">Upload Excel File(s):</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input 
              type="file" 
              multiple 
              id="files" 
              accept=".xlsx,.xls" 
              onChange={handleFileUpload} 
              style={{ fontSize: '12px', padding: '2px' }} 
            />
            <button type="submit">Process</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TtsForm;