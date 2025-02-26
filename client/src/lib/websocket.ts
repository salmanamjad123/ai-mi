
/**
 * Creates a WebSocket connection with proper error handling
 * @param path - The endpoint path (e.g., '/ws/transcription')
 * @param token - Authentication token
 * @returns WebSocket instance
 */
export function createWebSocketConnection(path: string, token: string): WebSocket {
  // Ensure token is defined to prevent URL issues
  if (!token) {
    throw new Error('Token is required for WebSocket connection');
  }

  // Construct WebSocket URL with port 5000 and token
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const url = new URL(`${protocol}//${host}:5000${path}`);
  url.searchParams.append('token', token);

  // Create WebSocket instance
  const ws = new WebSocket(url.toString());

  // Connection opened
  ws.addEventListener('open', () => {
    console.log('WebSocket connection established');
  });

  // Connection error
  ws.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
  });

  // Connection closed
  ws.addEventListener('close', (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
  });

  return ws;
}
