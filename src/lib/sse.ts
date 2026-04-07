// SSE Manager for real-time updates
// Uses a singleton pattern to manage SSE connections per household

type SSECallback = (data: unknown) => void;

interface SSEConnection {
  id: string;
  householdId: string;
  controller: ReadableStreamDefaultController;
  lastEventId: string;
}

class SSEManager {
  private connections: Map<string, SSEConnection> = new Map();

  addConnection(id: string, householdId: string, controller: ReadableStreamDefaultController) {
    this.connections.set(id, { id, householdId, controller, lastEventId: '0' });
  }

  removeConnection(id: string) {
    this.connections.delete(id);
  }

  // Broadcast an event to all connections in a household
  broadcast(householdId: string, event: string, data: unknown) {
    for (const [connId, conn] of this.connections) {
      if (conn.householdId === householdId) {
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\nid: ${Date.now()}\n\n`;
          conn.controller.enqueue(new TextEncoder().encode(payload));
        } catch {
          // Connection might be closed
          this.removeConnection(connId);
        }
      }
    }
  }

  // Send to a specific connection
  send(connectionId: string, event: string, data: unknown) {
    const conn = this.connections.get(connectionId);
    if (conn) {
      try {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\nid: ${Date.now()}\n\n`;
        conn.controller.enqueue(new TextEncoder().encode(payload));
      } catch {
        this.removeConnection(connectionId);
      }
    }
  }

  getConnectionCount(householdId?: string): number {
    if (householdId) {
      let count = 0;
      for (const conn of this.connections.values()) {
        if (conn.householdId === householdId) count++;
      }
      return count;
    }
    return this.connections.size;
  }

  createStream(connectionId: string, householdId: string): ReadableStream {
    return new ReadableStream({
      start: (controller) => {
        this.addConnection(connectionId, householdId, controller);

        // Send initial connection event
        const payload = `event: connected\ndata: ${JSON.stringify({ connectionId, householdId })}\nid: ${Date.now()}\n\n`;
        controller.enqueue(new TextEncoder().encode(payload));

        // Send heartbeat every 30 seconds
        const heartbeat = setInterval(() => {
          try {
            const ping = `event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\nid: ${Date.now()}\n\n`;
            controller.enqueue(new TextEncoder().encode(ping));
          } catch {
            clearInterval(heartbeat);
            this.removeConnection(connectionId);
          }
        }, 30000);

        // Cleanup on close
        // The connection will be cleaned up when the response ends
      },
      cancel: () => {
        this.removeConnection(connectionId);
      },
    });
  }
}

// Singleton instance
export const sseManager = typeof window !== 'undefined' ? null : new SSEManager();

// Helper to broadcast events (can be called from API routes)
export function broadcastEvent(householdId: string, event: string, data: unknown) {
  sseManager?.broadcast(householdId, event, data);
}

// Helper to broadcast new message
export function broadcastNewMessage(householdId: string, message: unknown) {
  broadcastEvent(householdId, 'new-message', message);
}

// Helper to broadcast new interaction
export function broadcastNewInteraction(householdId: string, interaction: unknown) {
  broadcastEvent(householdId, 'new-interaction', interaction);
}

// Helper to broadcast presence update
export function broadcastPresence(householdId: string, userId: string, zoneId: string) {
  broadcastEvent(householdId, 'presence', { userId, zoneId, timestamp: Date.now() });
}
