import { RoomServiceClient, EgressClient } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = process.env.LIVEKIT_URL || '';

export class LiveKitEgressService {
  private egressClient: EgressClient;
  private roomService: RoomServiceClient;

  constructor() {
    if (!LIVEKIT_URL) {
      throw new Error('LIVEKIT_URL is not configured');
    }
    this.egressClient = new EgressClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    this.roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  }

  /**
   * Start recording a room as MP4 file
   * @param roomName Name of the room to record
   * @param options Recording options
   */
  async startRoomRecording(roomName: string, options?: {
    layout?: string;
    filepath?: string;
    preset?: 'H264_720P_30' | 'H264_720P_60' | 'H264_1080P_30' | 'H264_1080P_60';
    s3?: {
      accessKey: string;
      secret: string;
      bucket: string;
      region: string;
    };
  }) {
    try {
      const fileOutput: any = {
        filepath: options?.filepath || `${roomName}-${Date.now()}.mp4`,
      };

      // Add S3 upload if configured
      if (options?.s3) {
        fileOutput.s3 = {
          access_key: options.s3.accessKey,
          secret: options.s3.secret,
          bucket: options.s3.bucket,
          region: options.s3.region,
        };
      }

      const request: any = {
        roomName,
        layout: options?.layout || 'speaker',
        file: fileOutput,
      };

      // Add preset if specified
      if (options?.preset) {
        const presetMap: Record<string, number> = {
          H264_720P_30: 0,
          H264_720P_60: 1,
          H264_1080P_30: 2,
          H264_1080P_60: 3,
        };
        request.preset = presetMap[options.preset] || 0;
      }

      const info = await this.egressClient.startRoomCompositeEgress(request as any);
      return info;
    } catch (error) {
      console.error('Failed to start room recording:', error);
      throw error;
    }
  }

  /**
   * Start recording audio only
   * @param roomName Name of the room to record
   * @param options Recording options
   */
  async startAudioRecording(roomName: string, options?: {
    filepath?: string;
    s3?: {
      accessKey: string;
      secret: string;
      bucket: string;
      region: string;
    };
  }) {
    try {
      const fileOutput: any = {
        filepath: options?.filepath || `${roomName}-audio-${Date.now()}.mp4`,
      };

      if (options?.s3) {
        fileOutput.s3 = {
          access_key: options.s3.accessKey,
          secret: options.s3.secret,
          bucket: options.s3.bucket,
          region: options.s3.region,
        };
      }

      const request: any = {
        roomName,
        audioOnly: true,
        file: fileOutput,
      };

      const info = await this.egressClient.startRoomCompositeEgress(request as any);
      return info;
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      throw error;
    }
  }

  /**
   * Stop an active recording
   * @param egressId Egress ID to stop
   */
  async stopRecording(egressId: string) {
    try {
      const info = await this.egressClient.stopEgress(egressId);
      return info;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  /**
   * List active recordings
   * @param roomName Optional room name to filter
   */
  async listRecordings(roomName?: string) {
    try {
      const request: any = {};
      if (roomName) {
        request.roomName = roomName;
      }
      const recordings = await this.egressClient.listEgress(request);
      return recordings;
    } catch (error) {
      console.error('Failed to list recordings:', error);
      throw error;
    }
  }

  /**
   * Get recording info by ID
   * @param egressId Egress ID
   */
  async getRecordingInfo(egressId: string) {
    try {
      const recordings = await this.listRecordings();
      const recording = recordings.find(r => r.egressId === egressId);
      return recording || null;
    } catch (error) {
      console.error('Failed to get recording info:', error);
      throw error;
    }
  }

  /**
   * Update stream URLs (add or remove RTMP destinations)
   * @param egressId Egress ID
   * @param addUrls URLs to add
   * @param removeUrls URLs to remove
   */
  async updateStreamUrls(egressId: string, addUrls?: string[], removeUrls?: string[]) {
    try {
      const request: any = {
        egressId,
      };
      if (addUrls) {
        request.addOutputUrls = addUrls;
      }
      if (removeUrls) {
        request.removeOutputUrls = removeUrls;
      }
      const info = await this.egressClient.updateStream(request as any);
      return info;
    } catch (error) {
      console.error('Failed to update stream URLs:', error);
      throw error;
    }
  }

  /**
   * Update layout for active recording
   * @param egressId Egress ID
   * @param layout New layout name
   */
  async updateLayout(egressId: string, layout: string) {
    try {
      const info = await this.egressClient.updateLayout(egressId, layout);
      return info;
    } catch (error) {
      console.error('Failed to update layout:', error);
      throw error;
    }
  }
}

// Singleton instance
export const egressService = new LiveKitEgressService();
