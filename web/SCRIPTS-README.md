# TTS Website - Development Assistant Scripts

These scripts help you work with GitHub Copilot to iteratively fix warnings and errors in your TTS website.

## npm-start-assistant.sh

This script runs `npm start` and captures any warnings or errors that appear. When it finds issues:

1. It copies the warnings/errors to your clipboard
2. You paste these to GitHub Copilot
3. GitHub Copilot suggests fixes
4. You apply the fixes
5. The script restarts `npm start`
6. The process repeats until no more warnings/errors are detected

### Usage:

```bash
./npm-start-assistant.sh
```

## apply-fix.sh

This script helps apply fixes suggested by GitHub Copilot to specific files.

### Usage:

```bash
./apply-fix.sh <file_path> <fix_description>
```

Example:
```bash
./apply-fix.sh src/App.js "Fix ESLint warnings"
```

When prompted, paste GitHub Copilot's suggested code and press Ctrl+D to save.

## Complete Workflow

1. Run `./npm-start-assistant.sh`
2. When errors are detected, they're copied to your clipboard
3. Paste the errors to GitHub Copilot
4. Ask GitHub Copilot to fix the issues
5. Use `./apply-fix.sh` to apply GitHub Copilot's suggested fix
6. Press Enter in the npm-start-assistant terminal to restart and check for more errors
7. Repeat until no more errors/warnings appear

## Tips

- Keep both scripts running in separate terminal windows
- You can always manually edit files instead of using the apply-fix script
- If you want to revert a change, each fix creates a .bak file you can restore
