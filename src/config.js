const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

if (!BACKEND_URL) {
  console.warn('REACT_APP_BACKEND_URL is not set. API calls will use relative URLs.');
}

export const API = BACKEND_URL + '/api';
export const API_URL = BACKEND_URL;
