# TTS Website - OpenAI Text-to-Speech Application

A React web application for generating audio files from text using OpenAI's Text-to-Speech API.

## Features

- Generate audio from text input using OpenAI's TTS API
- Upload Excel files containing prompts for batch audio generation
- Select from multiple AI voice options (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
- Add custom persona instructions to modify the speaking style
- Download generated audio files individually or in bulk
- Simple and user-friendly interface
- Local API key storage for convenience

## Prerequisites

- Node.js (version 14 or higher)
- OpenAI API key with Text-to-Speech access

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Configuration

1. Create a `.env` file in the root directory
2. Add your OpenAI API key:

```
REACT_APP_OPENAI_API_KEY=your_api_key_here
```

Alternatively, you can enter your API key directly in the application's interface.

## Usage

### Starting the Application

In the project directory, you can run:

```bash
npm start
```

This runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

## Using the Application

### Text Input

1. Enter your text in the "Prompt" field
2. (Optional) Add persona instructions to modify how the text is spoken
3. Select a voice from the dropdown menu
4. Click "Generate Audio from Prompt"
5. The generated audio will appear in the playlist below

### Excel File Input

1. Prepare an Excel file (.xlsx or .xls) with your prompts:
   - Column A: Text prompts (required)
   - Column B: Voice selection (optional, defaults to "alloy")
   - Column C: Persona instructions (optional)
2. Click "Choose File" and select your Excel file
3. Click "Process Excel Files"
4. The generated audio files will appear in the playlist below

### Managing Generated Audio

- Play: Click the "Play" button next to any audio file
- Download: Click the "Download" button to save an individual file
- Bulk Download: Select multiple files using the checkboxes and click "Download Selected"

## Excel File Format

For batch processing, your Excel file should follow this structure:

| Prompt Text (Required) | Voice (Optional) | Persona Instructions (Optional) |
|------------------------|------------------|--------------------------------|
| Hello world            | alloy            | Speak with enthusiasm          |
| Another example        | nova             | Speak slowly and clearly       |
| Yet another example    |                  |                                |

- First row can be a header (will be detected automatically)
- If voice is omitted, "alloy" will be used as default
- Available voices: alloy, echo, fable, onyx, nova, shimmer

## Troubleshooting

- **API Key Issues**: Ensure your API key is valid and has access to the TTS API. API keys should begin with "sk-".
- **Excel Format**: Make sure your Excel file follows the expected format. The first column must contain the text to convert.
- **Large Files**: When processing large Excel files, the application may take some time. Please be patient.

## Deployment

To deploy this application to production:

```bash
npm run build
```

This builds the app for production to the `build` folder.\
It bundles React in production mode and optimizes the build for the best performance.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [OpenAI](https://www.openai.com/) for providing the TTS API
- [Create React App](https://github.com/facebook/create-react-app) for the application framework
