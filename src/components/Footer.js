// src/components/Footer.js
import React from 'react';

const Footer = () => {
  return (
    <footer className="App-footer">
      <p style={{ margin: '5px 0', fontSize: '12px' }}>&copy; {new Date().getFullYear()} Text-to-Speech Generator</p>
    </footer>
  );
};

export default Footer;