import React, { useState } from 'react';
import OpenAI from "openai";
import { parseXlsx } from './utils';  // Import parseXlsx from utils.js

// Initialize OpenAI with API key from environment variables
// Make sure to set REACT_APP_OPENAI_API_KEY in your .env file
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for browser usage, though not recommended for production
});

const TtsComponent = () => {
  const [prompt, setPrompt] = useState('');
  const [persona, setPersona] = useState('');
  const [voice, setVoice] = useState('coral');
  const [files, setFiles] = useState([]);
  const [audioFiles, setAudioFiles] = useState([]);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handlePersonaChange = (e) => {
    setPersona(e.target.value);
  };

  const handleVoiceChange = (e) => {
    setVoice(e.target.value);
  };

  const handleFileUpload = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const generateAudioFromPrompt = async (customPrompt = null) => {
    const textToProcess = customPrompt || prompt;
    
    if (!textToProcess.trim()) {
      alert('Please enter a prompt text');
      return;
    }

    try {
      console.log(`Generating audio for: "${textToProcess}"`);
      
      const response = await openai.audio.speech.create({
        model: "tts-1", // Using tts-1 as gpt-4o-mini-tts doesn't exist
        voice: voice,
        input: textToProcess,
        instructions: persona || undefined, // Only include if there is actual content
      });
      
      const audioBlob = await response.blob();
      const fileName = `${textToProcess.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
      
      // Create File object that can be used in browser
      const audioFile = new File([audioBlob], fileName, { type: 'audio/mpeg' });
      
      // Create URL for playback
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Add to our state with the prompt and URL information
      setAudioFiles(prev => [...prev, {
        name: fileName,
        url: audioBlob,
        prompt: textToProcess,
        checked: false
      }]);
      
      console.log(`Successfully generated audio for: "${textToProcess}"`);
      return { success: true, file: audioFile };
    } catch (error) {
      console.error('Error generating TTS:', error);
      alert(`Error generating speech: ${error.message || 'Unknown error'}`);
      return { success: false, error };
    }
  };

  const handleUpload = async () => {
    for (let file of files) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        try {
          // Use the imported parseXlsx function
          const rows = await parseXlsx(file);
          
          // Process each row from the spreadsheet
          for (let i = 1; i < rows.length; i++) {
            if (rows[i] && rows[i][0]) {  // Check if row exists and has content
              const promptText = rows[i][0];
              // Generate audio for each prompt in the spreadsheet
              await generateAudioFromPrompt(promptText);
            }
          }
        } catch (error) {
          console.error('Error processing XLSX file:', error);
        }
      }
    }
  };

  const handleDownload = () => {
    const selectedFiles = audioFiles.filter((_, index) => document.getElementById(`checkbox-${index}`).checked);
    if (selectedFiles.length > 0) {
      selectedFiles.forEach(file => downloadFile(file));
    } else {
      // Logic to download all files
      audioFiles.forEach(file => downloadFile(file));
    }
  };

  const downloadFile = (file) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import parseXlsx from utils.js instead of redefining it here

  return (
    <div>
      <h1>Text-to-Speech Generator</h1>
      <input type="text" placeholder="Prompt" value={prompt} onChange={handlePromptChange} />
      <input type="text" placeholder="Persona" value={persona} onChange={handlePersonaChange} />
      <select value={voice} onChange={handleVoiceChange}>
        <option value="coral">Coral</option>
        <option value="echo">Echo</option>
        {/* Add other voice options */}
      </select>
      <input type="file" multiple onChange={handleFileUpload} />
      <button onClick={generateAudioFromPrompt}>Generate Audio from Prompt</button>
      <button onClick={handleUpload}>Upload .xlsx File</button>
      <button onClick={handleDownload}>GO MUTHAFUCKA!!</button>
      <h2>Playlist</h2>
      <table>
        <thead>
          <tr>
            <th>File Name</th>
            <th>Length</th>
            <th>Prompt Text</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {audioFiles.map((file, index) => (
            <tr key={index}>
              <td>{file.name}</td>
              <td>{'0:00'}</td>
              <td>{prompt}</td>
              <td>
                <button onClick={() => playAudio(file)}>Play</button>
                <button onClick={() => downloadFile(file)}>Download</button>
                <input type="checkbox" id={`checkbox-${index}`} onChange={(e) => file.checked = e.target.checked} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const playAudio = (file) => {
  const audio = new Audio(URL.createObjectURL(file));
  audio.play();
};

export default TtsComponent;