import { api } from './axios';
import { type Agent, type CreateAgentRequest } from '../types';

export const agentService = {
  getAll: async () => {
    const { data } = await api.get<Agent[]>('/agents');
    return data;
  },
  getById: async (id: number) => {
    const { data } = await api.get<Agent>(`/agents/${id}`);
    return data;
  },
  create: async (request: CreateAgentRequest) => {
    const { data } = await api.post<Agent>('/agents', request);
    return data;
  },
  update: async (id: number, request: Partial<Agent>) => {
    const { data } = await api.put<void>(`/agents/${id}`, request);
    return data;
  },
  delete: async (id: number) => {
    const { data } = await api.delete<void>(`/agents/${id}`);
    return data;
  },
};
