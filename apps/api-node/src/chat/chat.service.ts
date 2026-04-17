/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SupabaseService } from '../supabase/supabase.service';
import { PythonService } from '../roadmap/python.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ts?: string;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly pythonService: PythonService,
    private readonly logger: Logger,
  ) {}

  /** Most recent conversation messages for the user (or empty array). */
  async getHistory(userId: string): Promise<{ messages: ChatMessage[] }> {
    const { data, error } = await this.supabase
      .getClient()
      .from('ai_conversations')
      .select('messages')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger.warn({ err: error }, 'Failed to load chat history');
      return { messages: [] };
    }

    return { messages: (data?.messages as ChatMessage[]) ?? [] };
  }

  /** GDPR: clear all conversations for the user. */
  async clearHistory(userId: string) {
    const { error } = await this.supabase
      .getClient()
      .from('ai_conversations')
      .delete()
      .eq('user_id', userId);
    if (error) {
      this.logger.warn({ err: error }, 'Failed to clear chat history');
    }
    return { message: 'Chat history cleared' };
  }

  /** Pull the user's profile (chat needs visa_type + bundesland for context). */
  async getUserProfile(userId: string): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException(
        'Profile not found. Complete onboarding before chatting.',
      );
    }
    return data as Record<string, unknown>;
  }

  /** Non-streaming chat fallback (used if the client cannot consume SSE). */
  async sendMessage(
    userId: string,
    message: string,
    contextType?: string,
  ): Promise<Record<string, unknown>> {
    const profile = await this.getUserProfile(userId);
    const { messages: conversationHistory } = await this.getHistory(userId);

    const result = await this.pythonService.chat({
      user_id: userId,
      message,
      context_type: contextType ?? 'general',
      conversation_history: conversationHistory,
      profile,
    });

    if (!result) {
      throw new ServiceUnavailableException(
        'AI assistant is temporarily unavailable. Please try again in a moment.',
      );
    }

    return result;
  }

  /**
   * Open a streaming chat connection. Returns the raw SSE body from the
   * Python service for the controller to pipe back to the client.
   */
  async streamMessage(
    userId: string,
    message: string,
    contextType?: string,
  ): Promise<ReadableStream<Uint8Array>> {
    const profile = await this.getUserProfile(userId);
    const { messages: conversationHistory } = await this.getHistory(userId);

    const stream = await this.pythonService.chatStream({
      user_id: userId,
      message,
      context_type: contextType ?? 'general',
      conversation_history: conversationHistory,
      profile,
    });

    if (!stream) {
      throw new ServiceUnavailableException(
        'AI assistant is temporarily unavailable. Please try again in a moment.',
      );
    }

    return stream;
  }

  /** Persist a thumbs-up / thumbs-down on a previous response. */
  async submitFeedback(
    userId: string,
    logId: string,
    rating: 1 | -1,
    comment?: string,
  ) {
    const { error } = await this.supabase
      .getClient()
      .from('ai_feedback')
      .insert({
        log_id: logId,
        user_id: userId,
        rating,
        comment: comment ?? null,
      });
    if (error) {
      this.logger.warn({ err: error }, 'Failed to record feedback');
      return { ok: false };
    }
    return { ok: true };
  }
}
