import { useQuery } from '@tanstack/react-query';

import api from '../lib/api';

export interface Client {
  id: string;
  name?: string | null;
  phoneNumber: string;
  messagesCount: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
}

async function fetchClients() {
  const { data } = await api.get<Client[]>('/api/clients');
  return data;
}

export function useClients() {
  return useQuery({ queryKey: ['clients'], queryFn: fetchClients, refetchInterval: 10000 });
}
