/**
 * API Service for Feelio Frontend
 * Handles all backend communication
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface ChatMessage {
  message: string;
  emotion?: string;
  session_id: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  emotion: string;
  crisis_detected: boolean;
  playbook?: string;
  error?: string;
}

export interface SessionResponse {
  success: boolean;
  session_id: string;
  message: string;
  error?: string;
}

export interface SummaryResponse {
  success: boolean;
  summary: string;
  turn_count: number;
  emotions: Record<string, number>;
  error?: string;
}

class ApiService {
  private sessionId: string | null = null;

  /**
   * Start a new therapy session
   */
  async startSession(): Promise<string> {
    try {
      const response = await fetch(`${API_URL}/api/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data: SessionResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start session');
      }

      this.sessionId = data.session_id;
      return data.session_id;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  /**
   * Send a message to the therapist
   */
  async sendMessage(message: string, emotion: string = 'neutral'): Promise<ChatResponse> {
    try {
      if (!this.sessionId) {
        await this.startSession();
      }

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          message,
          emotion,
        }),
      });

      const data: ChatResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get session summary
   */
  async getSessionSummary(): Promise<SummaryResponse> {
    try {
      if (!this.sessionId) {
        throw new Error('No active session');
      }

      const response = await fetch(`${API_URL}/api/session/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: this.sessionId,
        }),
      });

      const data: SummaryResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get summary');
      }

      return data;
    } catch (error) {
      console.error('Error getting summary:', error);
      throw error;
    }
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    try {
      if (!this.sessionId) {
        return;
      }

      await fetch(`${API_URL}/api/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: this.sessionId,
        }),
      });

      this.sessionId = null;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Check if session is active
   */
  hasActiveSession(): boolean {
    return this.sessionId !== null;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
