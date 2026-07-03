import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { UploadResponse } from '../types';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard,
    staleTime: Infinity,
    retry: 1,
  });
}

export function useRecommendations(params?: URLSearchParams) {
  return useQuery({
    queryKey: ['recommendations', params?.toString()],
    queryFn: () => api.recommendations(params),
    staleTime: Infinity,
    retry: 1,
  });
}

export function useResources(params?: URLSearchParams) {
  return useQuery({
    queryKey: ['resources', params?.toString()],
    queryFn: () => api.resources(params),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useForecast() {
  return useQuery({
    queryKey: ['forecast'],
    queryFn: api.forecast,
    staleTime: Infinity,
    retry: 1,
  });
}

export function useScore() {
  return useQuery({
    queryKey: ['score'],
    queryFn: api.score,
    staleTime: Infinity,
    retry: 1,
  });
}

export function useUpload() {
  const queryClient = useQueryClient();

  return useMutation<UploadResponse, Error, FormData>({
    mutationFn: api.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      queryClient.invalidateQueries({ queryKey: ['score'] });
    },
  });
}

export function useReportDownload() {
  return useMutation({
    mutationFn: async () => {
      const blob = await api.report();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CloudSight_AI_Report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}
