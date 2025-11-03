"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { VoiceChat } from '@/components/voice/voice-chat';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft } from 'lucide-react';

interface VisitData {
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

export default function VisitPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const visitId = params.id as string;

  const [visit, setVisit] = useState<VisitData | null>(null);
  const [livekitToken, setLivekitToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Load visit data
  useEffect(() => {
    if (!loading && user && visitId) {
      loadVisitData();
    }
  }, [user, loading, visitId]);

  const loadVisitData = async () => {
    try {
      // Get visit details
      const visitResponse = await fetch(`/api/visits/${visitId}`);
      if (!visitResponse.ok) {
        throw new Error('Failed to load visit');
      }

      const visitData = await visitResponse.json();
      setVisit(visitData.visit);

      // Get LiveKit token
      const tokenResponse = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: visitData.visit.livekitRoomName }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get LiveKit token');
      }

      const tokenData = await tokenResponse.json();
      setLivekitToken(tokenData.token);

    } catch (err) {
      console.error('Error loading visit:', err);
      setError('Не удалось загрузить данные визита');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscription = (text: string, isUser: boolean) => {
    // Save transcription to database
    console.log('Transcription:', { text, isUser, visitId });
  };

  const handleEndVisit = () => {
    // Update visit status and redirect
    router.push('/rep/visits');
  };

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || user.role !== 'rep') {
    router.push('/signin');
    return null;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Card className="glass-card max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400">Ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white mb-4">{error}</p>
            <Button onClick={() => router.push('/rep')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к визитам
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!visit || !livekitToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Card className="glass-card max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Загрузка визита...</CardTitle>
          </CardHeader>
          <CardContent>
            <Spinner size="lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <VoiceChat
      roomName={visit.livekitRoomName}
      livekitToken={livekitToken}
      doctorName={visit.doctor.name}
      visitId={visitId}
      onTranscription={handleTranscription}
      onEndVisit={handleEndVisit}
    />
  );
}
