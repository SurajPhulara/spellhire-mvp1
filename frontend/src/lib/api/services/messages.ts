// Message Service - Handles all messaging and real-time communication API calls
import { apiClient } from '../client';
import {
  ConversationCreate,
  ConversationUpdate,
  ConversationResponse,
  ConversationListResponse,
  ConversationWithDetailsResponse,
  ConversationWithDetailsListResponse,
  ConversationParticipantCreate,
  ConversationParticipantResponse,
  ConversationParticipantListResponse,
  MessageCreate,
  MessageUpdate,
  MessageResponse,
  MessageListResponse,
  MessageStatsResponse,
  ConversationFilters,
  MessageFilters,
  ConversationType,
  MessageType,
  UserType,
  ApiResponse,
} from '@/types';

// Socket.IO imports
import { io, Socket } from 'socket.io-client';

export class MessageService {
  private static socket: Socket | null = null;
  private static connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private static eventListeners: Map<string, Function[]> = new Map();

  // ============================================================================
  // CONVERSATION MANAGEMENT ENDPOINTS
  // ============================================================================

  // Create Conversation
  static async createConversation(data: ConversationCreate): Promise<ApiResponse<ConversationResponse>> {
    return await apiClient.post<ConversationResponse>('/messages/conversations/', data);
  }

  // Get Conversations
  static async getConversations(
    filters?: ConversationFilters & { page?: number; limit?: number }
  ): Promise<ApiResponse<ConversationWithDetailsListResponse>> {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.type) params.append('type_filter', filters.type);
    if (filters?.is_group_chat !== undefined) params.append('is_group_chat', filters.is_group_chat.toString());
    if (filters?.has_unread !== undefined) params.append('has_unread', filters.has_unread.toString());
    if (filters?.search_query) params.append('search_query', filters.search_query);

    const queryString = params.toString();
    const url = queryString ? `/messages/conversations/?${queryString}` : '/messages/conversations/';
    
    return await apiClient.get<ConversationWithDetailsListResponse>(url);
  }

  // Get Conversation Details
  static async getConversation(conversationId: string): Promise<ApiResponse<ConversationWithDetailsResponse>> {
    return await apiClient.get<ConversationWithDetailsResponse>(`/messages/conversations/${conversationId}`);
  }

  // Update Conversation
  static async updateConversation(
    conversationId: string,
    data: ConversationUpdate
  ): Promise<ApiResponse<ConversationResponse>> {
    return await apiClient.put<ConversationResponse>(`/messages/conversations/${conversationId}`, data);
  }

  // ============================================================================
  // MESSAGE MANAGEMENT ENDPOINTS
  // ============================================================================

  // Send Message
  static async sendMessage(
    conversationId: string,
    data: MessageCreate
  ): Promise<ApiResponse<MessageResponse>> {
    return await apiClient.post<MessageResponse>(`/messages/conversations/${conversationId}/messages`, data);
  }

  // Get Messages
  static async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<MessageListResponse>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return await apiClient.get<MessageListResponse>(
      `/messages/conversations/${conversationId}/messages?${params.toString()}`
    );
  }

  // Update Message
  static async updateMessage(
    messageId: string,
    data: MessageUpdate
  ): Promise<ApiResponse<MessageResponse>> {
    return await apiClient.put<MessageResponse>(`/messages/messages/${messageId}`, data);
  }

  // Delete Message
  static async deleteMessage(messageId: string): Promise<ApiResponse<{ message_id: string }>> {
    return await apiClient.delete<{ message_id: string }>(`/messages/messages/${messageId}`);
  }

  // ============================================================================
  // CONVERSATION PARTICIPANTS
  // ============================================================================

  // Add Participant
  static async addParticipant(
    conversationId: string,
    data: ConversationParticipantCreate
  ): Promise<ApiResponse<ConversationParticipantResponse>> {
    return await apiClient.post<ConversationParticipantResponse>(
      `/messages/conversations/${conversationId}/participants`,
      data
    );
  }

  // Get Participants
  static async getParticipants(
    conversationId: string
  ): Promise<ApiResponse<ConversationParticipantListResponse>> {
    return await apiClient.get<ConversationParticipantListResponse>(
      `/messages/conversations/${conversationId}/participants`
    );
  }

  // Remove Participant
  static async removeParticipant(
    conversationId: string,
    participantId: string
  ): Promise<ApiResponse<{ participant_id: string }>> {
    return await apiClient.delete<{ participant_id: string }>(
      `/messages/conversations/${conversationId}/participants/${participantId}`
    );
  }

  // ============================================================================
  // MESSAGE STATISTICS
  // ============================================================================

  // Get Message Statistics
  static async getMessageStats(): Promise<ApiResponse<MessageStatsResponse>> {
    return await apiClient.get<MessageStatsResponse>('/messages/stats');
  }

  // ============================================================================
  // SOCKET.IO REAL-TIME COMMUNICATION
  // ============================================================================

  // Connect to Socket.IO
  static connectSocket(token: string, serverUrl: string = 'http://localhost:8000'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.connectionStatus = 'connecting';

      this.socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      this.socket.on('connect', () => {
        this.connectionStatus = 'connected';
        console.log('Socket.IO connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        this.connectionStatus = 'disconnected';
        console.error('Socket.IO connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        this.connectionStatus = 'disconnected';
        console.log('Socket.IO disconnected:', reason);
      });

      // Set up default event listeners
      this.setupDefaultEventListeners();
    });
  }

  // Disconnect Socket
  static disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus = 'disconnected';
      this.eventListeners.clear();
    }
  }

  // Get Connection Status
  static getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStatus;
  }

  // ============================================================================
  // SOCKET.IO EVENT EMITTERS
  // ============================================================================

  // Join Conversation
  static joinConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', { conversation_id: conversationId });
    }
  }

  // Leave Conversation
  static leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', { conversation_id: conversationId });
    }
  }

  // Send Message via Socket
  static sendSocketMessage(data: {
    conversation_id: string;
    message_type: MessageType;
    content: string;
    metadata?: Record<string, any>;
    reply_to_id?: string;
  }): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', data);
    }
  }

  // Start Typing
  static startTyping(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { conversation_id: conversationId, is_typing: true });
    }
  }

  // Stop Typing
  static stopTyping(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { conversation_id: conversationId, is_typing: false });
    }
  }

  // Mark as Read
  static markAsRead(conversationId: string, messageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_as_read', { conversation_id: conversationId, message_id: messageId });
    }
  }

  // Get Online Users
  static getOnlineUsers(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('get_online_users', { conversation_id: conversationId });
    }
  }

  // ============================================================================
  // SOCKET.IO EVENT LISTENERS
  // ============================================================================

  // Add Event Listener
  static addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove Event Listener
  static removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Remove All Event Listeners
  static removeAllEventListeners(event?: string): void {
    if (event) {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.forEach(callback => {
          if (this.socket) {
            this.socket.off(event, callback);
          }
        });
        this.eventListeners.delete(event);
      }
    } else {
      this.eventListeners.forEach((listeners, eventName) => {
        listeners.forEach(callback => {
          if (this.socket) {
            this.socket.off(eventName, callback);
          }
        });
      });
      this.eventListeners.clear();
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  // Get conversation type display text
  static getConversationTypeText(type: ConversationType): string {
    const typeMap: Record<ConversationType, string> = {
      [ConversationType.EMPLOYER_INTERNAL]: 'Team Chat',
      [ConversationType.CANDIDATE_TO_CANDIDATE]: 'Candidate Chat',
      [ConversationType.RECRUITER_TO_CANDIDATE]: 'Recruiter Chat',
    };
    return typeMap[type] || type;
  }

  // Get message type display text
  static getMessageTypeText(type: MessageType): string {
    const typeMap: Record<MessageType, string> = {
      [MessageType.TEXT]: 'Text',
      [MessageType.IMAGE]: 'Image',
      [MessageType.FILE]: 'File',
      [MessageType.SYSTEM]: 'System',
    };
    return typeMap[type] || type;
  }

  // Check if conversation is expired
  static isConversationExpired(conversation: { type: ConversationType; expires_at?: string }): boolean {
    if (conversation.type !== ConversationType.RECRUITER_TO_CANDIDATE) {
      return false;
    }
    
    if (!conversation.expires_at) {
      return false;
    }
    
    return new Date(conversation.expires_at) < new Date();
  }

  // Check if message can be edited
  static canEditMessage(message: { created_at: string }): boolean {
    const messageTime = new Date(message.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);
    return diffMinutes <= 15;
  }

  // Format message time
  static formatMessageTime(dateString: string, format: 'relative' | 'absolute' | 'time' | 'date' = 'relative'): string {
    const date = new Date(dateString);
    const now = new Date();
    
    switch (format) {
      case 'relative':
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
        
      case 'absolute':
        return date.toLocaleString();
        
      case 'time':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
      case 'date':
        return date.toLocaleDateString();
        
      default:
        return date.toLocaleString();
    }
  }

  // Format conversation name
  static formatConversationName(
    conversation: { is_group_chat: boolean; group_name?: string },
    participants: Array<{ first_name: string; last_name: string }>,
    currentUserId: string
  ): string {
    if (conversation.is_group_chat && conversation.group_name) {
      return conversation.group_name;
    }
    
    if (conversation.is_group_chat) {
      const otherParticipants = participants.filter(p => p.first_name && p.last_name);
      if (otherParticipants.length === 0) return 'Group Chat';
      if (otherParticipants.length === 1) {
        return `${otherParticipants[0].first_name} ${otherParticipants[0].last_name}`;
      }
      return `${otherParticipants[0].first_name} and ${otherParticipants.length - 1} others`;
    }
    
    const otherParticipant = participants.find(p => p.first_name && p.last_name);
    return otherParticipant ? `${otherParticipant.first_name} ${otherParticipant.last_name}` : 'Chat';
  }

  // Get conversation avatar
  static getConversationAvatar(
    conversation: { is_group_chat: boolean },
    participants: Array<{ profile_picture_url?: string; first_name: string; last_name: string }>
  ): string | null {
    if (conversation.is_group_chat) {
      // For group chats, return the first participant's avatar or null
      const participantWithAvatar = participants.find(p => p.profile_picture_url);
      return participantWithAvatar?.profile_picture_url || null;
    }
    
    // For 1-on-1 chats, return the other participant's avatar
    const otherParticipant = participants.find(p => p.profile_picture_url);
    return otherParticipant?.profile_picture_url || null;
  }

  // Get user initials
  static getUserInitials(firstName: string, lastName: string): string {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }

  // Check if user is online
  static isUserOnline(userId: string, onlineUsers: Array<{ id: string }>): boolean {
    return onlineUsers.some(user => user.id === userId);
  }

  // Get unread count text
  static getUnreadCountText(count: number): string {
    if (count === 0) return '';
    if (count < 100) return count.toString();
    return '99+';
  }

  // Validate message content
  static validateMessageContent(content: string): { isValid: boolean; error?: string } {
    if (!content || content.trim().length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }
    
    if (content.length > 4000) {
      return { isValid: false, error: 'Message is too long (max 4000 characters)' };
    }
    
    return { isValid: true };
  }

  // Get message preview
  static getMessagePreview(content: string, maxLength: number = 50): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  // Check if message is from current user
  static isOwnMessage(message: { sender_id: string }, currentUserId: string): boolean {
    return message.sender_id === currentUserId;
  }

  // Get message status
  static getMessageStatus(message: { is_edited: boolean; created_at: string }): 'sent' | 'edited' | 'deleted' {
    if (message.is_edited) return 'edited';
    return 'sent';
  }

  // Format file size
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file type icon
  static getFileTypeIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const iconMap: Record<string, string> = {
      pdf: '📄',
      doc: '📄',
      docx: '📄',
      txt: '📄',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      mp4: '🎥',
      avi: '🎥',
      mov: '🎥',
      mp3: '🎵',
      wav: '🎵',
      zip: '📦',
      rar: '📦',
      xlsx: '📊',
      xls: '📊',
    };
    
    return iconMap[extension || ''] || '📎';
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  // Setup default event listeners
  private static setupDefaultEventListeners(): void {
    if (!this.socket) return;

    // Re-setup existing event listeners
    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach(callback => {
        this.socket!.on(event, callback);
      });
    });
  }
}

export default MessageService;
