import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

export function createToken(identity: string, roomName: string, metadata?: string): string {
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    metadata,
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return token.toJwt();
}

export function createDoctorToken(roomName: string, doctorId: string): string {
  return createToken(`doctor-${doctorId}`, roomName, JSON.stringify({
    role: 'doctor',
    type: 'ai',
  }));
}

export function createRepToken(roomName: string, repId: string): string {
  return createToken(`rep-${repId}`, roomName, JSON.stringify({
    role: 'representative',
    type: 'human',
  }));
}
