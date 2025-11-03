"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useVisitStore } from '@/stores/visit-store';

interface Visit {
  id: string;
  status: string;
  livekitRoomName: string;
  scenario: {
    title: string;
    difficultyLevel: string;
  };
  doctor: {
    name: string;
    personalityType: string;
  };
}

interface CreateVisitData {
  scenarioId: string;
  doctorId: string;
}

export function useVisits() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { setVisits, setIsLoading, setError } = useVisitStore();

  const { data: visits, isLoading, error } = useQuery<{ visits: Visit[] }>({
    queryKey: ['visits'],
    queryFn: async () => {
      const response = await fetch('/api/visits', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch visits');
      }

      return response.json();
    },
    enabled: !!token,
  });

  const createVisitMutation = useMutation({
    mutationFn: async (data: CreateVisitData) => {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create visit');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });

  // Update Zustand store when data changes
  if (visits) {
    setVisits(visits.visits);
  }
  setIsLoading(isLoading);
  setError(error ? (error as Error).message : null);

  return {
    visits: visits?.visits || [],
    isLoading,
    error,
    createVisit: createVisitMutation.mutateAsync,
    isCreating: createVisitMutation.isPending,
  };
}
