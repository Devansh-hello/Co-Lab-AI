/**
 * SSE Fallback Hook
 *
 * Provides a Server-Sent Events transport as fallback when WebSocket
 * connections fail repeatedly (e.g. corporate proxies). Receives events
 * via SSE and sends commands via REST POST.
 *
 * Usage: Activated automatically by useWebSocket when consecutive
 * WebSocket failures exceed MAX_WS_FAILURES_BEFORE_SSE.
 */

import { useRef, useCallback, useEffect } from 'react';
import { api } from '../functions/send';

interface SSEFallbackOptions {
  sessionId: string | null;
  onMessage: (data: any) => void;
  enabled: boolean;
}

export function useSSEFallback({ sessionId, onMessage, enabled }: SSEFallbackOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!sessionId || !enabled) return;
    if (eventSourceRef.current) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const url = `${baseUrl}/sse/${sessionId}`;

    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.addEventListener('pipeline', (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error('[sse] Failed to parse event:', err);
      }
    });

    es.addEventListener('connected', () => {
      console.log('[sse] Connected to SSE transport');
    });

    es.onerror = () => {
      console.warn('[sse] Connection error — EventSource will auto-reconnect');
    };
  }, [sessionId, onMessage, enabled]);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  /** Send a command via REST POST (since SSE is read-only) */
  const sendCommand = useCallback(async (command: any) => {
    if (!sessionId) return;
    try {
      await api.post(`/pipeline/${sessionId}/command`, command);
    } catch (err) {
      console.error('[sse] Failed to send command:', err);
    }
  }, [sessionId]);

  useEffect(() => {
    if (enabled) connect();
    return disconnect;
  }, [enabled, connect, disconnect]);

  return { sendCommand, disconnect };
}
