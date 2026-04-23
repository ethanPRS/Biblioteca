import { useEffect, useRef, useCallback } from 'react';

type RealtimeEventHandler = (domain: string, eventType: string) => void;

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/realtime/stream`;

// Global set of listeners – shared across all context providers
const listeners = new Set<RealtimeEventHandler>();
let eventSource: EventSource | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let isConnecting = false;

function connect() {
  if (isConnecting || (eventSource && eventSource.readyState !== EventSource.CLOSED)) return;
  isConnecting = true;

  try {
    eventSource = new EventSource(API_URL);

    eventSource.onopen = () => {
      isConnecting = false;
      console.log('[Realtime] Conexión SSE establecida');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') {
          console.log('[Realtime] Confirmación del servidor recibida');
          return;
        }
        // Notify all registered listeners
        const { table: domain, eventType } = data;
        for (const handler of listeners) {
          handler(domain, eventType);
        }
      } catch (err) {
        // Ignore parse errors (heartbeats, etc.)
      }
    };

    eventSource.onerror = () => {
      isConnecting = false;
      console.warn('[Realtime] Conexión SSE perdida. Reconectando en 3s...');
      eventSource?.close();
      eventSource = null;
      // Reconnect after a short delay
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(connect, 3000);
    };
  } catch {
    isConnecting = false;
  }
}

/**
 * Hook to subscribe to real-time database change events.
 * 
 * @param domains - Array of domain names to listen for (e.g. ['books', 'loans'])
 * @param onEvent - Callback fired when a matching change event arrives
 */
export function useRealtimeSubscription(
  domains: string[],
  onEvent: () => void
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const domainsKey = domains.join(',');

  const handler: RealtimeEventHandler = useCallback(
    (domain: string, _eventType: string) => {
      if (domains.includes(domain)) {
        onEventRef.current();
      }
    },
    [domainsKey]
  );

  useEffect(() => {
    // Ensure the SSE connection is active
    connect();

    // Register our handler
    listeners.add(handler);

    return () => {
      listeners.delete(handler);
      // If no more listeners, close the connection
      if (listeners.size === 0) {
        eventSource?.close();
        eventSource = null;
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      }
    };
  }, [handler]);
}
