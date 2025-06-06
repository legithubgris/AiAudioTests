const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../uploads/'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('spreadsheet') || 
        file.originalname.endsWith('.xlsx') || 
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// Supported voices and models
const SUPPORTED_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'ash', 'sage', 'coral'];
const SUPPORTED_MODELS = ['gpt-4o-mini-tts', 'tts-1', 'tts-1-hd'];

// Store active playlists in memory (in production, use a database)
const playlists = new Map();

// Initialize OpenAI client
let openai = null;

// Validate and set API key
router.post('/set-api-key', (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey || !apiKey.startsWith('sk-')) {
    req.logger.warn('Invalid API key provided');
    return res.status(400).json({ error: 'Invalid API key. Must start with sk-' });
  }
  
  try {
    openai = new OpenAI({ apiKey });
    req.logger.info('OpenAI API key set successfully');
    res.json({ success: true, message: 'API key set successfully' });
  } catch (error) {
    req.logger.error('Failed to initialize OpenAI client:', error);
    res.status(500).json({ error: 'Failed to initialize OpenAI client' });
  }
});

// Generate single audio from text
router.post('/generate-single', async (req, res) => {
  if (!openai) {
    return res.status(400).json({ error: 'OpenAI API key not set' });
  }

  const { text, voice = 'alloy', model = 'tts-1', instructions = '' } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Validate voice and model
  const selectedVoice = SUPPORTED_VOICES.includes(voice) ? voice : 'alloy';
  const selectedModel = SUPPORTED_MODELS.includes(model) ? model : 'tts-1';

  const requestData = {
    model: selectedModel,
    voice: selectedVoice,
    input: text,
    ...(instructions && { instructions })
  };

  req.logger.info('Generating single audio:', requestData);

  try {
    const mp3 = await openai.audio.speech.create(requestData);
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    const filename = `audio_${Date.now()}.mp3`;
    
    req.logger.info('Audio generated successfully:', {
      filename,
      size: buffer.length,
      voice: selectedVoice,
      model: selectedModel
    });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${filename}"`
    });

    res.send(buffer);
  } catch (error) {
    req.logger.error('Failed to generate audio:', error);
    res.status(500).json({ error: 'Failed to generate audio: ' + error.message });
  }
});

// Process Excel file and generate audio playlist
router.post('/process-excel', upload.single('excelFile'), async (req, res) => {
  if (!openai) {
    return res.status(400).json({ error: 'OpenAI API key not set' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No Excel file uploaded' });
  }

  const playlistId = uuidv4();
  req.logger.info('Processing Excel file:', { filename: req.file.originalname, playlistId });

  try {
    // Read and parse Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // Remove header row if it exists
    const rows = data.filter(row => row.some(cell => cell && cell.toString().trim()));
    if (rows.length === 0) {
      throw new Error('No data found in Excel file');
    }

    const playlist = {
      id: playlistId,
      name: req.file.originalname,
      files: [],
      createdAt: new Date().toISOString()
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip empty rows
      if (!row || !row[0] || !row[0].toString().trim()) {
        continue;
      }

      // Parse columns according to specification
      const promptText = row[0] ? row[0].toString().trim() : '';
      const instructions = row[1] ? row[1].toString().trim() : (row[4] ? row[4].toString().trim() : '');
      const model = row[2] ? row[2].toString().trim() : 'tts-1';
      const voice = row[3] ? row[3].toString().trim() : 'alloy';

      if (!promptText) {
        req.logger.warn(`Skipping row ${i + 1}: No prompt text`);
        continue;
      }

      // Validate and sanitize inputs
      const selectedVoice = SUPPORTED_VOICES.includes(voice.toLowerCase()) ? voice.toLowerCase() : 'alloy';
      const selectedModel = SUPPORTED_MODELS.includes(model.toLowerCase()) ? model.toLowerCase() : 'tts-1';
      
      // Create filename from prompt text (sanitized)
      const sanitizedPrompt = promptText.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
      const filename = `${sanitizedPrompt}_${Date.now()}_${i}.mp3`;

      const requestData = {
        model: selectedModel,
        voice: selectedVoice,
        input: promptText,
        ...(instructions && { instructions })
      };

      req.logger.info(`Generating audio for row ${i + 1}:`, requestData);

      try {
        const mp3 = await openai.audio.speech.create(requestData);
        const buffer = Buffer.from(await mp3.arrayBuffer());

        // Save file temporarily
        const filePath = path.join(__dirname, '../uploads', filename);
        await fs.writeFile(filePath, buffer);

        playlist.files.push({
          id: uuidv4(),
          filename,
          promptText,
          instructions,
          voice: selectedVoice,
          model: selectedModel,
          filePath,
          size: buffer.length,
          status: 'completed'
        });

        req.logger.info(`Audio generated successfully for row ${i + 1}:`, {
          filename,
          size: buffer.length,
          voice: selectedVoice,
          model: selectedModel
        });

      } catch (error) {
        req.logger.error(`Failed to generate audio for row ${i + 1}:`, error);
        
        playlist.files.push({
          id: uuidv4(),
          filename: `error_${i}.mp3`,
          promptText,
          instructions,
          voice: selectedVoice,
          model: selectedModel,
          filePath: null,
          size: 0,
          status: 'error',
          error: error.message
        });
      }
    }

    // Store playlist
    playlists.set(playlistId, playlist);

    // Clean up uploaded Excel file
    await fs.remove(req.file.path);

    req.logger.info('Excel processing completed:', {
      playlistId,
      totalFiles: playlist.files.length,
      successful: playlist.files.filter(f => f.status === 'completed').length,
      errors: playlist.files.filter(f => f.status === 'error').length
    });

    res.json({
      playlistId,
      playlist,
      message: `Processed ${playlist.files.length} items from Excel file`
    });

  } catch (error) {
    req.logger.error('Failed to process Excel file:', error);
    
    // Clean up uploaded file
    if (req.file && req.file.path) {
      await fs.remove(req.file.path).catch(() => {});
    }
    
    res.status(500).json({ error: 'Failed to process Excel file: ' + error.message });
  }
});

// Get playlist
router.get('/playlist/:playlistId', (req, res) => {
  const { playlistId } = req.params;
  const playlist = playlists.get(playlistId);
  
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }
  
  res.json(playlist);
});

// Delete playlist
router.delete('/playlist/:playlistId', async (req, res) => {
  const { playlistId } = req.params;
  const playlist = playlists.get(playlistId);
  
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  try {
    // Delete all associated files
    for (const file of playlist.files) {
      if (file.filePath && await fs.pathExists(file.filePath)) {
        await fs.remove(file.filePath);
      }
    }

    // Remove playlist from memory
    playlists.delete(playlistId);
    
    req.logger.info('Playlist deleted:', { playlistId, filesDeleted: playlist.files.length });
    
    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    req.logger.error('Failed to delete playlist:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

module.exports = router;
