import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/theme.css';
import './styles/app.css';
import './styles/landing.css';
import './styles/workspace.css';

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
