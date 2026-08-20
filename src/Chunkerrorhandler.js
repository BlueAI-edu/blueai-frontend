/**
 * Chunk Error Handler
 * Catches chunk loading errors from dynamic imports and triggers a page reload.
 *
 * This handler:
 * 1. Intercepts "Loading chunk X failed" errors
 * 2. Detects if it's a chunk error vs other errors
 * 3. Reloads the page to fetch fresh chunks
 * 4. Prevents infinite reload loops
 *
 * Add this to your main entry file (index.js or main.jsx)
 */

let chunkFailedMessage = false;

window.addEventListener('error', (event) => {
  // Check if the error is a chunk loading error
  const isChunkLoadError =
    event.message && event.message.includes('Loading chunk')
    || (event.filename && event.filename.includes('chunk'))
    || (event.error && event.error.message && event.error.message.includes('Loading chunk'));

  if (isChunkLoadError) {
    // Prevent infinite reload loops
    if (!chunkFailedMessage) {
      chunkFailedMessage = true;
      console.error('[ChunkErrorHandler] Chunk loading failed:', event);

      // Store in sessionStorage to detect infinite loops
      const reloadCount = parseInt(sessionStorage.getItem('chunkReloadCount') || '0', 10);

      if (reloadCount < 3) {
        // Safe to reload
        sessionStorage.setItem('chunkReloadCount', String(reloadCount + 1));
        console.log(`[ChunkErrorHandler] Reloading page to fetch fresh chunks (attempt ${reloadCount + 1}/3)`);
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // Too many reloads, likely a persistent issue
        console.error('[ChunkErrorHandler] Maximum reload attempts reached. Stopping to prevent infinite loop.');
        sessionStorage.removeItem('chunkReloadCount');
        // The ErrorBoundary will catch this and show the error UI
      }
    }
  }
});

// Guard against sessionStorage being unavailable (privacy mode, disabled storage)
let reloadCount = 0;
try {
  reloadCount = parseInt(sessionStorage.getItem('chunkReloadCount') || '0', 10);
} catch (e) {
  // SessionStorage not available (privacy mode, disabled, etc)
  console.warn('[ChunkErrorHandler] SessionStorage unavailable, continuing without loop detection');
  reloadCount = 0;
}

try {
  sessionStorage.setItem('chunkReloadCount', String(reloadCount + 1));
} catch (e) {
  // SessionStorage not available, log but continue with reload
  console.warn('[ChunkErrorHandler] Cannot write to sessionStorage, reloading anyway');
}

// Clean up reload counter on successful navigation
window.addEventListener('load', () => {
  // After 5 seconds of successful load, reset the counter
  setTimeout(() => {
    if (document.readyState === 'complete') {
      sessionStorage.removeItem('chunkReloadCount');
      chunkFailedMessage = false;
    }
  }, 5000);
});