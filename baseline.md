1.) You are an expert react developer who can refine code to be functional to spec. This page interacts with an API from openai.fm### . The code found in #### is supposed to do the following when the user uploads an xlsx file to the react.js authored web page

2.) Ingest the xlsx document, parsing out the following in columns A - E
    a. Prompt Name: the filename of the returned audio prompt from the API. The file should only be labeld via the contents of this cell, do not add anything else to the filename.
    b. Prompt Text: This is the phrase being sent to the API, to be generated into audio.
    c. Model: this is the model to be invoked when sending audio to the API. Every time I have tried to send the model specifics to the API, I get a return of an audio file with the incorrect model so make sure you find the code to make sure that this information of what model to send to the API actually works.
    d. Voice: This is the voice to be used when invoking the API
    e. Instructions: These are the instructions to send to the instructions field of the API for each audio file request

3.) Create a .log file that lives in the home directory of this web application (where I invoke 'npm start' or npm start build'). It must tell me what info is being sent to the API, and what the responses are in return for each rewquest, including any messaging, error or otherwise.

4.) Generate a playlist made of the spreadsheet imported. On the right side of the list, have a a check button and a download button. At the bottom of the page have 4 buttons:
1. Select all - checks all the buttons
2. Download selected - downloads into a zip the selected files.
3. Clear checks - unchecks all the files in the playlist
4. Delete playlist - delete the playlist as well as the files generated in the backend.