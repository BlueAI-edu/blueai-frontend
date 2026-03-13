import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

// MSAL configuration
export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/common`, // 'common' supports both personal and work/school accounts
    redirectUri: window.location.origin + '/teacher/login',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: true,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        const isDevelopment = process.env.NODE_ENV !== 'production';
        if (isDevelopment) {
          switch (level) {
            case LogLevel.Error:
              console.error(message);
              return;
            case LogLevel.Info:
              console.info(message);
              return;
            case LogLevel.Verbose:
              console.debug(message);
              return;
            case LogLevel.Warning:
              console.warn(message);
              return;
            default:
              return;
          }
        } else if (level === LogLevel.Error) {
          console.error(message);
        }
      },
    },
  },
};

// Add scopes for API access
export const loginRequest = {
  scopes: [
    `api://${process.env.REACT_APP_AZURE_BACKEND_CLIENT_ID}/access_as_user`,
    'openid',
    'profile',
    'email',
  ],
};

// Initialize MSAL instance in a closure to avoid global scope pollution
const createMsalInstance = (() => {
  let instance = null;

  return () => {
    if (!instance) {
      instance = new PublicClientApplication(msalConfig);
    }
    return instance;
  };
})();

export const msalInstance = createMsalInstance();

// Remove and block global exposure after initialization
if (typeof window !== 'undefined') {
  try {
    delete window.msalInstance;
    delete window.msal;
    
    const blockGlobalAccess = (name) => {
      const descriptor = Object.getOwnPropertyDescriptor(window, name);
      if (!descriptor || descriptor.configurable) {
        Object.defineProperty(window, name, {
          get: () => undefined,
          set: () => {},
          configurable: false,
          enumerable: true
        });
      }
    };
    
    blockGlobalAccess('msalInstance');
    blockGlobalAccess('msal');
  } catch (e) {
    // Ignore errors in strict mode or non-supporting environments
  }
}

// Initialize MSAL
msalInstance.initialize().then(() => {
  msalInstance.handleRedirectPromise().catch(err => {
    console.error('Redirect error:', err);
  });
});
