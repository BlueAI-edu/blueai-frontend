const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

if (!BACKEND_URL) {
  console.warn('REACT_APP_BACKEND_URL is not set. API calls will use relative URLs.');
}

export const API = BACKEND_URL + '/api';
export const API_URL = BACKEND_URL;

// Bulk multi-file upload (#271, pilot release) — must match
// config/constants.py's MULTI_UPLOAD_MAX_FILES on the backend; the server is
// still the source of truth/enforcement, this only drives the client-side
// "too many files" warning before upload.
export const MULTI_UPLOAD_MAX_FILES = 35;
