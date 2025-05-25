import React, { useState } from 'react';

const ApiKeyInput = ({ initialApiKey, onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState(initialApiKey || '');
  const [isEditing, setIsEditing] = useState(!initialApiKey);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (apiKey && apiKey.trim()) {
      onApiKeyChange(apiKey.trim());
      setIsEditing(false);
    }
  };

  const handleChange = (e) => {
    setApiKey(e.target.value);
  };

  return (
    <div className="api-key-input">
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div className="api-key-form">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={handleChange}
              placeholder="Enter your OpenAI API key (starts with sk-...)"
              className="api-key-field"
            />              <button 
              type="button" 
              className="toggle-visibility"
              onClick={() => setShowApiKey(!showApiKey)}
              style={{ padding: '6px 10px', fontSize: '12px' }}
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
            <button 
              type="submit" 
              className="save-key"
              style={{ padding: '6px 10px', fontSize: '12px' }}
            >
              Save Key
            </button>
          </div>
          <div className="api-key-help">
            <p>Key stored locally and sent directly to OpenAI API. Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">OpenAI's website</a>.</p>
          </div>
        </form>
      ) : (
        <div className="api-key-status">
          <div>
            <span className="api-key-info">API Key: {showApiKey ? apiKey : "••••••••" + apiKey.slice(-4)}</span>
            <button 
              type="button" 
              className="toggle-visibility small"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
          <button 
            onClick={() => setIsEditing(true)} 
            className="change-key"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            Change API Key
          </button>
        </div>
      )}
    </div>
  );
};

export default ApiKeyInput;
