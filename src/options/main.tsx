import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../styles/fonts.css';
import '../styles/themes.css';
import '../popup/styles.css';

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
