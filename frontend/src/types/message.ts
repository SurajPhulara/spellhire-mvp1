// Message System Types - Real-time messaging and conversation types

import { UserType, UserSummary, UserStatus } from './base';

// ============================================================================
// CONVERSATION TYPES
// ============================================================================

export enum ConversationType {
  EMPLOYER_INTERNAL = 'EMPLOYER_INTERNAL',
  CANDIDATE_TO_CANDIDATE = 'CANDIDATE_TO_CANDIDATE',
  RECRUITER_TO_CANDIDATE = 'RECRUITER_TO_CANDIDATE',
}

export interface Conversation {
  id: string;
  type: ConversationType;
  organization_id?: string;
  is_group_chat: boolean;
  group_name?: string;
  created_by_id: string;
  created_by_type: UserType;
  last_message_at: string; // ISO date string
  expires_at?: string; // ISO date string
  is_active: boolean;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface ConversationCreate {
  type: ConversationType;
  organization_id?: string;
  is_group_chat: boolean;
  group_name?: string;
  participant_ids: string[];
}

export interface ConversationUpdate {
  group_name?: string;
  is_active?: boolean;
}

export interface ConversationResponse {
  conversation: Conversation;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================================================
// CONVERSATION PARTICIPANT TYPES
// ============================================================================

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  user_type: UserType;
  joined_at: string; // ISO date string
  last_read_at: string; // ISO date string
  is_admin: boolean;
  left_at?: string; // ISO date string
}

export interface ConversationParticipantCreate {
  user_id: string;
  user_type: UserType;
  is_admin: boolean;
}

export interface ConversationParticipantResponse {
  participant: ConversationParticipant;
}

export interface ConversationParticipantListResponse {
  participants: ConversationParticipant[];
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: UserType;
  message_type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  reply_to_id?: string;
  is_edited: boolean;
  edited_at?: string; // ISO date string
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface MessageCreate {
  conversation_id: string;
  message_type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  reply_to_id?: string;
}

export interface MessageUpdate {
  content: string;
}

export interface MessageResponse {
  message: Message;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================================================
// USER SUMMARY TYPES
// ============================================================================
// UserSummary is imported from base.ts

// ============================================================================
// CONVERSATION WITH DETAILS TYPES
// ============================================================================

export interface ConversationWithDetails {
  conversation: Conversation;
  participants: UserSummary[];
  last_message?: Message;
  unread_count: number;
  current_user_participant?: ConversationParticipant;
}

export interface ConversationWithDetailsResponse {
  conversation_with_details: ConversationWithDetails;
}

export interface ConversationWithDetailsListResponse {
  conversations_with_details: ConversationWithDetails[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================================================
// SOCKET.IO EVENT TYPES
// ============================================================================

export interface SocketMessage {
  conversation_id: string;
  message_type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  reply_to_id?: string;
}

export interface SocketTyping {
  conversation_id: string;
  is_typing: boolean;
}

export interface SocketReadReceipt {
  conversation_id: string;
  message_id: string;
}

export interface SocketNewMessage {
  message: Message;
  sender_info: UserSummary;
}

export interface SocketUserTyping {
  conversation_id: string;
  user_id: string;
  user_name: string;
  is_typing: boolean;
}

export interface SocketMessageRead {
  conversation_id: string;
  message_id: string;
  user_id: string;
  read_at: string; // ISO date string
}

export interface SocketConversationUpdate {
  conversation_id: string;
  update_type: string;
  data: Record<string, any>;
}

export interface SocketNotification {
  type: string;
  data: Record<string, any>;
}

export interface SocketOnlineUsers {
  conversation_id: string;
  online_users: UserSummary[];
}

export interface SocketError {
  message: string;
}

export interface SocketConfirmation {
  conversation_id?: string;
  message_id?: string;
  status: string;
  message?: string;
}

// ============================================================================
// MESSAGE FILTERS
// ============================================================================

export interface MessageFilters {
  conversation_id?: string;
  sender_id?: string;
  message_type?: MessageType;
  created_after?: string; // ISO date string
  created_before?: string; // ISO date string
  search_query?: string;
}

export interface ConversationFilters {
  type?: ConversationType;
  is_group_chat?: boolean;
  is_active?: boolean;
  has_unread?: boolean;
  search_query?: string;
}

// ============================================================================
// MESSAGE STATISTICS
// ============================================================================

export interface MessageStats {
  total_conversations: number;
  total_messages: number;
  unread_messages: number;
  conversations_by_type: Record<string, number>;
  messages_by_type: Record<string, number>;
}

export interface MessageStatsResponse {
  stats: MessageStats;
}

// ============================================================================
// SOCKET.IO CONNECTION TYPES
// ============================================================================

export interface SocketConnectionConfig {
  url: string;
  token: string;
  options?: {
    transports?: string[];
    timeout?: number;
    forceNew?: boolean;
  };
}

export interface SocketConnectionStatus {
  connected: boolean;
  connecting: boolean;
  error?: string;
  reconnectAttempts: number;
}

// ============================================================================
// MESSAGE COMPOSER TYPES
// ============================================================================

export interface MessageComposerState {
  content: string;
  isTyping: boolean;
  replyTo?: Message;
  attachments: File[];
  isUploading: boolean;
}

export interface MessageAttachment {
  id: string;
  file: File;
  type: 'image' | 'file';
  url?: string;
  progress?: number;
  error?: string;
}

// ============================================================================
// CONVERSATION LIST TYPES
// ============================================================================

export interface ConversationListItem {
  conversation: Conversation;
  participants: UserSummary[];
  last_message?: Message;
  unread_count: number;
  is_online: boolean;
  typing_users: string[];
}

export interface ConversationListState {
  conversations: ConversationListItem[];
  loading: boolean;
  error?: string;
  hasMore: boolean;
  page: number;
}

// ============================================================================
// MESSAGE LIST TYPES
// ============================================================================

export interface MessageListItem {
  message: Message;
  sender: UserSummary;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  isEdited: boolean;
  isDeleted: boolean;
}

export interface MessageListState {
  messages: MessageListItem[];
  loading: boolean;
  error?: string;
  hasMore: boolean;
  page: number;
  isTyping: boolean;
  typingUsers: string[];
}

// ============================================================================
// REAL-TIME EVENTS TYPES
// ============================================================================

export interface RealTimeEvent {
  type: 'message' | 'typing' | 'read' | 'online' | 'offline' | 'error';
  data: any;
  timestamp: string; // ISO date string
}

export interface TypingIndicator {
  user_id: string;
  user_name: string;
  is_typing: boolean;
  conversation_id: string;
}

export interface ReadReceipt {
  message_id: string;
  user_id: string;
  read_at: string; // ISO date string
}

// ============================================================================
// MESSAGE SEARCH TYPES
// ============================================================================

export interface MessageSearchResult {
  message: Message;
  conversation: Conversation;
  sender: UserSummary;
  highlighted_content: string;
  relevance_score: number;
}

export interface MessageSearchResponse {
  results: MessageSearchResult[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================================================
// CONVERSATION MANAGEMENT TYPES
// ============================================================================

export interface ConversationCreateRequest {
  type: ConversationType;
  organization_id?: string;
  is_group_chat: boolean;
  group_name?: string;
  participant_ids: string[];
}

export interface ConversationInviteRequest {
  conversation_id: string;
  user_ids: string[];
  message?: string;
}

export interface ConversationLeaveRequest {
  conversation_id: string;
  reason?: string;
}

// ============================================================================
// MESSAGE REACTION TYPES (Future Enhancement)
// ============================================================================

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string; // ISO date string
}

export interface MessageReactionSummary {
  emoji: string;
  count: number;
  users: string[];
  hasUserReacted: boolean;
}

// ============================================================================
// MESSAGE THREAD TYPES (Future Enhancement)
// ============================================================================

export interface MessageThread {
  id: string;
  parent_message_id: string;
  conversation_id: string;
  messages: Message[];
  participant_count: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface MessageTimeFormat {
  format: 'relative' | 'absolute' | 'time' | 'date';
  showSeconds?: boolean;
  showYear?: boolean;
}

export interface ConversationSortOptions {
  field: 'last_message_at' | 'created_at' | 'unread_count' | 'name';
  order: 'asc' | 'desc';
}

export interface MessageGroupingOptions {
  groupBy: 'date' | 'sender' | 'none';
  maxTimeGap: number; // minutes
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface MessageError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string; // ISO date string
}

export interface ConversationError extends MessageError {
  conversation_id?: string;
}

export interface SocketError extends MessageError {
  event?: string;
  reconnect?: boolean;
}
