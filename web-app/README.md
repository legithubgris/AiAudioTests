# TTS Website - Text-to-Speech Generator

A comprehensive web application for generating audio from text using OpenAI's Text-to-Speech API. Supports both individual text input and bulk processing from Excel files.

## Features

- **Single Audio Generation**: Convert text to speech with customizable voice and model settings
- **Excel File Processing**: Bulk generate audio from spreadsheet data
- **Playlist Management**: Organize, play, download, and manage generated audio files
- **Comprehensive Logging**: All API requests and responses are logged for debugging
- **Modern UI**: Clean, responsive interface with real-time progress updates

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd /Users/gr4yf1r3/testSites/tts-website/web-app
   ```

2. **Install all dependencies**:
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env if needed (optional - API key is set via web interface)
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5001) and frontend client (port 3001).

5. **Open your browser** and go to `http://localhost:3001`

6. **Enter your OpenAI API key** in the web interface (starts with `sk-`)

## Usage

### Basic Text-to-Speech

1. Enter your OpenAI API key
2. Select voice and model preferences
3. Enter text in the text area
4. Click "Generate Audio from Prompt"
5. Audio file will be automatically downloaded

### Excel File Processing

1. Prepare an Excel file with the following columns:
   - **Column A**: Prompt Text (required)
   - **Column B**: Instructions (optional)
   - **Column C**: Model (optional, defaults to 'tts-1')
   - **Column D**: Voice (optional, defaults to 'alloy')
   - **Column E**: Alternative Instructions (optional)

2. Upload the Excel file using the file input
3. Wait for processing to complete
4. Manage your playlist with the available controls

### Playlist Management

- **Select All/Unselect All**: Toggle selection of all files
- **Download Selected**: Download multiple files as a ZIP archive
- **Clear Playlist**: Remove all files from the playlist
- **Clear Selected Files**: Remove only selected files
- **Individual Controls**: Play, download, or select individual files

## Supported Configuration

### Voices
- alloy, echo, fable, onyx, nova, shimmer, ash, sage, coral

### Models
- **gpt-4o-mini-tts**: Best quality (recommended)
- **tts-1**: Fast, standard quality
- **tts-1-hd**: Slower, higher quality

## Excel File Format

Example Excel structure:

| Prompt Text (A) | Instructions (B) | Model (C) | Voice (D) | Instructions (E) |
|-----------------|------------------|-----------|-----------|------------------|
| Hello world     | Speak clearly    | tts-1     | alloy     |                  |
| Another text    |                  | tts-1-hd  | nova      | Speak slowly     |

**Notes**:
- Only Column A (Prompt Text) is required
- Instructions can be in Column B or E
- Invalid voices/models will fall back to defaults
- Empty rows are automatically skipped

## Logging

All API interactions are logged to:
- `server/logs/combined.log`: All logs
- `server/logs/error.log`: Error logs only
- Console: Real-time logging during development

Logs include:
- API requests sent to OpenAI
- Response details and file sizes
- Error messages and debugging information
- Playlist operations

## Project Structure

```
web-app/
├── package.json          # Root package with scripts
├── .env.example         # Environment template
├── client/              # React frontend
│   ├── src/
│   │   ├── App.tsx      # Main application component
│   │   ├── App.css      # Application styles
│   │   └── ...
│   └── package.json     # Frontend dependencies
└── server/              # Node.js backend
    ├── server.js        # Main server file
    ├── routes/          # API routes
    │   ├── tts.js       # TTS generation endpoints
    │   └── files.js     # File download endpoints
    ├── logs/            # Application logs
    └── uploads/         # Temporary file storage
```

## Available Scripts

- `npm run dev`: Start both client and server in development mode
- `npm run server`: Start only the backend server
- `npm run client`: Start only the frontend client
- `npm run build`: Build the frontend for production
- `npm start`: Start the production server
- `npm run install-all`: Install dependencies for both client and server

## API Endpoints

### TTS Routes (`/api/tts`)
- `POST /set-api-key`: Set OpenAI API key
- `POST /generate-single`: Generate single audio file
- `POST /process-excel`: Process Excel file and generate playlist
- `GET /playlist/:id`: Get playlist information
- `DELETE /playlist/:id`: Delete playlist and files

### File Routes (`/api/files`)
- `GET /download/:playlistId/:fileId`: Download individual file
- `POST /download-zip/:playlistId`: Download multiple files as ZIP
- `GET /stream/:playlistId/:fileId`: Stream audio for playback

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure your OpenAI API key starts with `sk-` and has sufficient credits
2. **File Upload Error**: Check file format (.xlsx or .xls) and size (<10MB)
3. **Port Conflicts**: Change ports in package.json if 3000/5000 are in use
4. **Audio Playback**: Ensure browser supports MP3 audio playback

### Log Analysis

Check `server/logs/combined.log` for detailed information about:
- API request/response details
- File processing status
- Error messages and stack traces

## Development

### Adding New Features

1. **Backend**: Add routes in `server/routes/`
2. **Frontend**: Update `client/src/App.tsx`
3. **Styling**: Modify `client/src/App.css`

### Environment Variables

Optional environment variables in `.env`:
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode
- `MAX_FILE_SIZE`: Upload limit in bytes
- `LOG_LEVEL`: Logging verbosity

## License

This project is for educational and development purposes. Please ensure compliance with OpenAI's terms of service when using their API.
