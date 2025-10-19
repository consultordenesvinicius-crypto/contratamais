import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '../lib/api';

export interface Message {
  id: string;
  contactId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  aiModel?: string | null;
  createdAt: string;
}

async function fetchMessages(contactId: string) {
  const { data } = await api.get<Message[]>(`/api/messages`, { params: { contactId } });
  return data;
}

export function useMessages(contactId?: string) {
  return useQuery({
    queryKey: ['messages', contactId],
    queryFn: () => fetchMessages(contactId!),
    enabled: Boolean(contactId),
    refetchInterval: 5000,
  });
}

interface SendMessagePayload {
  contactId: string;
  message: string;
  useAI?: boolean;
  context?: string;
}

async function postMessage(payload: SendMessagePayload) {
  const { data } = await api.post<Message>('/api/messages', payload);
  return data;
}

export function useSendMessage(contactId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { message: string; useAI?: boolean; context?: string }) =>
      postMessage({
        contactId: contactId!,
        message: payload.message,
        useAI: payload.useAI,
        context: payload.context && payload.context.trim().length > 0 ? payload.context : undefined,
      }),
    onSuccess: async () => {
      if (contactId) {
        await queryClient.invalidateQueries({ queryKey: ['messages', contactId] });
        await queryClient.invalidateQueries({ queryKey: ['clients'] });
      }
    },
  });
}
