"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, TrendingUp, BookOpen, Award, Loader2, Video, MessageSquare } from "lucide-react";
import { MainChatZone } from "@/components/dashboard/main-chat-zone";
import { useVisits } from "@/hooks/use-visits";

export default function RepDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { visits, isLoading: visitsLoading } = useVisits();
  const [selectedVisit, setSelectedVisit] = useState<{
    id: string;
    roomName: string;
    token: string;
    doctorName: string;
  } | null>(null);
  const [isCreatingVisit, setIsCreatingVisit] = useState(false);

  const createNewVisit = async () => {
    if (!user) return;

    setIsCreatingVisit(true);
    try {
      const [scenariosRes, doctorsRes] = await Promise.all([
        fetch('/api/scenarios'),
        fetch('/api/doctors')
      ]);

      if (!scenariosRes.ok || !doctorsRes.ok) {
        throw new Error('Failed to load scenarios and doctors');
      }

      const scenariosData = await scenariosRes.json();
      const doctorsData = await doctorsRes.json();

      const scenarioId = scenariosData.scenarios[0]?.id;
      const doctorId = doctorsData.doctors[0]?.id;

      if (!scenarioId || !doctorId) {
        throw new Error('No scenarios or doctors available');
      }

      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, doctorId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create visit');
      }

      const data = await response.json();
      
      // Set as selected visit
      setSelectedVisit({
        id: data.visit.id,
        roomName: data.roomName,
        token: data.livekitToken,
        doctorName: data.visit.doctor?.name || 'AI Doctor',
      });
    } catch (error) {
      console.error('Error creating visit:', error);
    } finally {
      setIsCreatingVisit(false);
    }
  };

  const handleVisitSelect = async (visit: any) => {
    if (!visit.livekitRoomName) return;

    try {
      const tokenResponse = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: visit.livekitRoomName }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get token');
      }

      const tokenData = await tokenResponse.json();

      setSelectedVisit({
        id: visit.id,
        roomName: visit.livekitRoomName,
        token: tokenData.token,
        doctorName: visit.doctor?.name || 'AI Doctor',
      });
    } catch (error) {
      console.error('Error selecting visit:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 h-full">
      <div className="grid lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Left: Visits List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Video className="h-5 w-5" />
                My Visits
              </CardTitle>
              <CardDescription className="text-gray-400">
                Select a visit to start conversation
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={createNewVisit}
                disabled={isCreatingVisit}
              >
                {isCreatingVisit ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    New Visit
                  </>
                )}
              </Button>

              {visitsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : visits.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No visits yet. Create your first visit!
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {visits.map((visit: any) => (
                    <Card
                      key={visit.id}
                      className={`cursor-pointer transition-all backdrop-blur-md border-white/10 ${
                        selectedVisit?.id === visit.id
                          ? 'bg-blue-600/20 border-blue-400/50'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => handleVisitSelect(visit)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">
                              {visit.scenario?.title || 'Untitled Visit'}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              Dr. {visit.doctor?.name || 'Unknown'}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(visit.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              visit.status === 'completed'
                                ? 'default'
                                : visit.status === 'in_progress'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="ml-2"
                          >
                            {visit.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Completed</span>
                <span className="text-white font-semibold">
                  {visits.filter((v: any) => v.status === 'completed').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">In Progress</span>
                <span className="text-white font-semibold">
                  {visits.filter((v: any) => v.status === 'in_progress').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Chat & Voice Zone */}
        <div className="lg:col-span-2">
          <MainChatZone
            visitId={selectedVisit?.id}
            roomName={selectedVisit?.roomName}
            token={selectedVisit?.token}
            doctorName={selectedVisit?.doctorName}
          />
        </div>
      </div>
    </div>
  );
}