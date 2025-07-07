// Mock socket client for MVP - using polling instead of real WebSocket
// This can be replaced with actual Socket.IO implementation later

export interface SocketClient {
  connect: () => void;
  disconnect: () => void;
  on: (event: string, callback: (data: any) => void) => void;
  emit: (event: string, data: any) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

class MockSocketClient implements SocketClient {
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private isConnected = false;
  private pollInterval: NodeJS.Timeout | null = null;

  connect() {
    this.isConnected = true;
    this.emit("connect", {});
    
    // Start polling for updates
    this.pollInterval = setInterval(() => {
      if (this.isConnected) {
        this.emit("poll", {});
      }
    }, 2000);
  }

  disconnect() {
    this.isConnected = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.emit("disconnect", {});
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }
}

export const socketClient = new MockSocketClient();

// Auto-connect when imported
socketClient.connect();
