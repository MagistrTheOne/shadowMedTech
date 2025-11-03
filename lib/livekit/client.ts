import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

export interface TokenOptions {
  roomRecord?: boolean;
  canPublish?: boolean;
  canSubscribe?: boolean;
}

export function createToken(
  identity: string,
  roomName: string,
  metadata?: string,
  options?: TokenOptions
): string {
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    metadata,
  });

  const grant: any = {
    roomJoin: true,
    room: roomName,
    canPublish: options?.canPublish ?? true,
    canSubscribe: options?.canSubscribe ?? true,
  };

  // Add roomRecord permission if needed (required for Egress API)
  if (options?.roomRecord) {
    grant.roomRecord = true;
  }

  token.addGrant(grant);

  return token.toJwt();
}

export function createRecordingToken(identity: string, roomName: string): string {
  return createToken(identity, roomName, JSON.stringify({ role: 'recording' }), {
    roomRecord: true,
    canPublish: false,
    canSubscribe: false,
  });
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
