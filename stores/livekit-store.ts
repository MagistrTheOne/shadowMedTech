import { create } from 'zustand';
import { Room, RemoteParticipant, LocalParticipant, RemoteTrackPublication, Track } from 'livekit-client';

interface LiveKitState {
  room: Room | null;
  participants: Map<string, RemoteParticipant>;
  localParticipant: LocalParticipant | null;
  isConnected: boolean;
  error: string | null;

  // Actions
  setRoom: (room: Room | null) => void;
  addParticipant: (participant: RemoteParticipant) => void;
  removeParticipant: (sid: string) => void;
  setLocalParticipant: (participant: LocalParticipant | null) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useLiveKitStore = create<LiveKitState>((set) => ({
  room: null,
  participants: new Map(),
  localParticipant: null,
  isConnected: false,
  error: null,

  setRoom: (room) => set({ room }),

  addParticipant: (participant) =>
    set((state) => {
      const participants = new Map(state.participants);
      participants.set(participant.sid, participant);
      return { participants };
    }),

  removeParticipant: (sid) =>
    set((state) => {
      const participants = new Map(state.participants);
      participants.delete(sid);
      return { participants };
    }),

  setLocalParticipant: (participant) => set({ localParticipant: participant }),

  setConnected: (connected) => set({ isConnected: connected }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      room: null,
      participants: new Map(),
      localParticipant: null,
      isConnected: false,
      error: null,
    }),
}));
