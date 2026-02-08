import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

// MSAL configuration
export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/common`, // 'common' supports both personal and work/school accounts
    redirectUri: window.location.origin + '/teacher/login',
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
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

// Initialize MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
msalInstance.initialize().then(() => {
  // Handle redirect promise
  msalInstance.handleRedirectPromise().catch(err => {
    console.error('Redirect error:', err);
  });
});
