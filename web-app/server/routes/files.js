const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');

const router = express.Router();

// Download single file
router.get('/download/:playlistId/:fileId', async (req, res) => {
  const { playlistId, fileId } = req.params;
  
  // Note: In a real application, you'd get this from a database
  // For now, we'll get it from the playlists Map in the tts route
  // This is a simplified approach for the demo
  
  try {
    const filePath = path.join(__dirname, '../uploads', req.query.filename);
    
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stat = await fs.stat(filePath);
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename="${req.query.filename}"`
    });
    
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
    
    req.logger.info('File downloaded:', { playlistId, fileId, filename: req.query.filename });
    
  } catch (error) {
    req.logger.error('Failed to download file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Download multiple files as ZIP
router.post('/download-zip/:playlistId', async (req, res) => {
  const { playlistId } = req.params;
  const { fileIds } = req.body;
  
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ error: 'No files selected' });
  }
  
  try {
    const zipName = `playlist_${playlistId}_${Date.now()}.zip`;
    
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipName}"`
    });
    
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    archive.pipe(res);
    
    // Add files to archive
    for (const fileId of fileIds) {
      const filename = req.body.filenames?.[fileIds.indexOf(fileId)];
      if (filename) {
        const filePath = path.join(__dirname, '../uploads', filename);
        if (await fs.pathExists(filePath)) {
          archive.file(filePath, { name: filename });
        }
      }
    }
    
    await archive.finalize();
    
    req.logger.info('ZIP download completed:', { playlistId, filesCount: fileIds.length });
    
  } catch (error) {
    req.logger.error('Failed to create ZIP download:', error);
    res.status(500).json({ error: 'Failed to create ZIP download' });
  }
});

// Stream audio file for playback
router.get('/stream/:playlistId/:fileId', async (req, res) => {
  const { playlistId, fileId } = req.params;
  
  try {
    const filePath = path.join(__dirname, '../uploads', req.query.filename);
    
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stat = await fs.stat(filePath);
    const range = req.headers.range;
    
    if (range) {
      // Handle range requests for audio streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      
      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg'
      });
      
      const readStream = fs.createReadStream(filePath, { start, end });
      readStream.pipe(res);
    } else {
      res.set({
        'Content-Length': stat.size,
        'Content-Type': 'audio/mpeg'
      });
      
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    }
    
  } catch (error) {
    req.logger.error('Failed to stream file:', error);
    res.status(500).json({ error: 'Failed to stream file' });
  }
});

module.exports = router;
