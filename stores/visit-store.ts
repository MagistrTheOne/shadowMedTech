import { create } from 'zustand';

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

interface VisitState {
  currentVisit: Visit | null;
  visits: Visit[];
  isLoading: boolean;
  error: string | null;

  setCurrentVisit: (visit: Visit | null) => void;
  setVisits: (visits: Visit[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useVisitStore = create<VisitState>((set) => ({
  currentVisit: null,
  visits: [],
  isLoading: false,
  error: null,

  setCurrentVisit: (visit) => set({ currentVisit: visit }),
  setVisits: (visits) => set({ visits }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      currentVisit: null,
      visits: [],
      isLoading: false,
      error: null,
    }),
}));
