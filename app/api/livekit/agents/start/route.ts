import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { db } from '@/lib/db';
import { visits, doctors } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { spawn } from 'child_process';
import path from 'path';

// Store active agent processes
const activeAgents = new Map<string, any>();

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { visitId } = await request.json();

    if (!visitId) {
      return NextResponse.json({ error: 'Visit ID is required' }, { status: 400 });
    }

    // Check if agent is already running
    if (activeAgents.has(visitId)) {
      return NextResponse.json({
        message: 'Agent already running',
        visitId,
      });
    }

    // Get visit and doctor info
    const [visit] = await db
      .select({
        id: visits.id,
        livekitRoomName: visits.livekitRoomName,
        doctor: {
          id: doctors.id,
          name: doctors.name,
          personalityType: doctors.personalityType,
          promptTemplate: doctors.promptTemplate,
          empathyLevel: doctors.empathyLevel,
        },
      })
      .from(visits)
      .leftJoin(doctors, eq(visits.doctorId, doctors.id))
      .where(eq(visits.id, visitId))
      .limit(1);

    if (!visit || !visit.doctor) {
      return NextResponse.json({ error: 'Visit or doctor not found' }, { status: 404 });
    }

    if (!visit.livekitRoomName) {
      return NextResponse.json({ error: 'Visit has no LiveKit room' }, { status: 400 });
    }

    // Start Python agent as separate process
    const agentsDir = path.join(process.cwd(), 'agents');
    const agentScript = path.join(agentsDir, 'doctor_agent.py');

    // Prepare environment variables for agent
    const agentEnv = {
      ...process.env,
      VISIT_ID: visitId,
      ROOM_NAME: visit.livekitRoomName,
      DOCTOR_NAME: visit.doctor.name,
      LIVEKIT_URL: process.env.LIVEKIT_URL,
      LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
      GIGACHAT_CLIENT_ID: process.env.GIGACHAT_CLIENT_ID,
      GIGACHAT_CLIENT_SECRET: process.env.GIGACHAT_CLIENT_SECRET,
      GIGACHAT_AUTHORIZATION_KEY: process.env.GIGACHAT_AUTHORIZATION_KEY,
      GIGACHAT_API_URL: process.env.GIGACHAT_API_URL,
      GIGACHAT_OAUTH_URL: process.env.GIGACHAT_OAUTH_URL,
      GIGACHAT_SCOPE: process.env.GIGACHAT_SCOPE,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NEXTJS_API_URL: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      AGENT_SERVICE_TOKEN: process.env.AGENT_SERVICE_TOKEN || '',
      USE_SILERO_TTS: 'true',
      USE_OPENAI_STT: 'true',
    };

    // Determine Python executable (try python3 first, then python)
    const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
    
    // Check if venv exists and use it
    const venvPython = path.join(agentsDir, 'venv', process.platform === 'win32' ? 'Scripts' : 'bin', 'python');
    const useVenv = require('fs').existsSync(venvPython);
    const pythonCmd = useVenv ? venvPython : pythonExecutable;

    // Spawn Python agent process
    // The agent will run as a worker and connect to the room via JobContext
    // For development, we use 'dev' mode which connects directly to the room
    // In production, the agent would register as a worker and receive dispatch requests
    const agentProcess = spawn(pythonCmd, [
      agentScript,
      'dev',
      '--room', visit.livekitRoomName,
    ], {
      cwd: agentsDir,
      env: agentEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Store process
    activeAgents.set(visitId, {
      process: agentProcess,
      visitId,
      roomName: visit.livekitRoomName,
      doctorName: visit.doctor.name,
      startedAt: new Date(),
    });

    // Handle process output
    agentProcess.stdout?.on('data', (data) => {
      console.log(`[Agent ${visitId}] ${data.toString()}`);
    });

    agentProcess.stderr?.on('data', (data) => {
      console.error(`[Agent ${visitId}] ${data.toString()}`);
    });

    // Handle process exit
    agentProcess.on('exit', (code) => {
      console.log(`[Agent ${visitId}] Process exited with code ${code}`);
      activeAgents.delete(visitId);
    });

    agentProcess.on('error', (error) => {
      console.error(`[Agent ${visitId}] Process error:`, error);
      activeAgents.delete(visitId);
    });

    console.log(`AI Doctor ${visit.doctor.name} started for visit ${visitId} in room ${visit.livekitRoomName}`);

    return NextResponse.json({
      message: 'AI Doctor agent started successfully',
      doctorName: visit.doctor.name,
      roomName: visit.livekitRoomName,
      visitId: visitId,
      pid: agentProcess.pid,
    });

  } catch (error) {
    console.error('Start doctor agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Stop agent endpoint
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const visitId = searchParams.get('visitId');

    if (!visitId) {
      return NextResponse.json({ error: 'Visit ID is required' }, { status: 400 });
    }

    const agentInfo = activeAgents.get(visitId);
    if (!agentInfo) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Kill the process
    agentInfo.process.kill();
    activeAgents.delete(visitId);

    return NextResponse.json({
      message: 'Agent stopped successfully',
      visitId,
    });

  } catch (error) {
    console.error('Stop agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get active agents
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, ['admin', 'trainer', 'manager']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const agents = Array.from(activeAgents.entries()).map(([visitId, info]) => ({
    visitId,
    roomName: info.roomName,
    doctorName: info.doctorName,
    startedAt: info.startedAt,
    pid: info.process.pid,
  }));

  return NextResponse.json({ agents });
}
