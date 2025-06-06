# TTS Website - Implementation Summary

## New Features Implemented

### 1. Clear Playlist Functionality
- **Clear Playlist Button**: Added a dynamic button that changes text based on selection state
  - When no files are selected: Shows "Clear Playlist" - removes ALL files
  - When some files are selected: Shows "Clear Selected Files" - removes only selected files
  - Button is styled with red background to indicate destructive action

### 2. Select All/Unselect All Toggle
- **Smart Toggle Button**: Single button that changes text dynamically
  - When no files or some files are selected: Shows "Select All"
  - When all files are selected: Shows "Unselect All"
  - Automatically toggles all checkboxes with one click

### 3. Enhanced Excel Data Processing
The application now correctly processes ALL columns from Excel spreadsheets:
- **Column A**: Prompt name/Prompt Text (required)
- **Column B**: Prop text/Instructions (optional)
- **Column C**: Model (optional, defaults to 'tts-1')
- **Column D**: Voice (optional, defaults to 'alloy')
- **Column E**: Instructions (alternative to Column B)

### 4. Cache Clearing on Service Restart
- Automatically clears any cached audio data when the service restarts
- Prevents memory leaks from previous sessions
- Clears both localStorage and sessionStorage

### 5. Enhanced Playlist Display
The playlist now shows comprehensive information:
- File Name
- Voice used
- Model used
- Prompt Text (with word wrapping)
- Instructions/Persona (with word wrapping)
- Action buttons (Play, Download, Checkbox)

### 6. Memory Management
- Proper cleanup of blob URLs when files are removed
- Prevents memory leaks from accumulated audio data
- Efficient handling of large audio file collections

## How to Use

### Basic Usage
1. Enter your OpenAI API key (starts with sk-)
2. Either:
   - Enter text directly and click "Generate Audio from Prompt"
   - Upload an Excel file with the columns described above

### Playlist Management
1. **Select Files**: Use individual checkboxes or "Select All" button
2. **Download Files**: 
   - Individual: Click "Download" button for each file
   - Bulk: Select files and click "Download Selected"
3. **Clear Files**:
   - Clear specific files: Select them and click "Clear Selected Files"
   - Clear all files: With no files selected, click "Clear Playlist"

### Excel File Format
Your Excel file should have these columns (headers optional):
```
| Prompt Text (A) | Instructions (B) | Model (C)          | Voice (D) | Instructions (E) |
|-----------------|------------------|--------------------|-----------|------------------|
| Hello world     | Speak clearly    | gpt-4o-mini-tts    | alloy     |                  |
| Another text    |                  | gpt-4o-mini-tts    | nova      | Speak slowly     |
```

## Technical Details

### Supported Voices
- alloy, echo, fable, onyx, nova, shimmer, ash, sage, coral

### Supported Models
- gpt-4o-mini-tts (currently the best model)
- tts-1 (faster, standard quality)
- tts-1-hd (slower, higher quality)


### File Management
- Audio files are stored as blobs in browser memory
- Files can be downloaded individually or as a ZIP archive
- Playlist state is preserved during the session but cleared on restart

## Dependencies Added
- `jszip`: For creating ZIP archives of multiple files
- `file-saver`: For triggering file downloads

## Error Handling
- Invalid voices/models automatically fall back to defaults
- Empty prompts are skipped with warnings
- API errors are displayed in the playlist with error badges
- Progress tracking for bulk operations

The application now provides a complete audio generation and management experience with proper data handling from Excel files and robust playlist management capabilities.
