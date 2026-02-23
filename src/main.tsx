import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api';

// Configure Axios globally to use the API base URL
// We strip the trailing '/api' because the components explicitly call '/api/...'
axios.defaults.baseURL = API_BASE_URL.replace(/\/api\/?$/, '');

createRoot(document.getElementById('root')!).render(<App />);
