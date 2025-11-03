"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, TrendingUp, BookOpen, Award, Loader2 } from "lucide-react";

export default function RepDashboard() {
  const { user, signout } = useAuth();
  const router = useRouter();
  const [isCreatingVisit, setIsCreatingVisit] = useState(false);

  const createNewVisit = async () => {
    if (!user) return;

    setIsCreatingVisit(true);
    try {
      // Get available scenarios and doctors
      const [scenariosRes, doctorsRes] = await Promise.all([
        fetch('/api/scenarios'),
        fetch('/api/doctors')
      ]);

      if (!scenariosRes.ok || !doctorsRes.ok) {
        throw new Error('Failed to load scenarios and doctors');
      }

      const scenariosData = await scenariosRes.json();
      const doctorsData = await doctorsRes.json();

      // Use first available scenario and doctor
      const scenarioId = scenariosData.scenarios[0]?.id;
      const doctorId = doctorsData.doctors[0]?.id;

      if (!scenarioId || !doctorId) {
        throw new Error('No scenarios or doctors available');
      }

      // Create a new visit
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId,
          doctorId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create visit');
      }

      const data = await response.json();
      const visitId = data.visit.id;

      // Redirect to the voice chat
      router.push(`/rep/visits/${visitId}`);
    } catch (error) {
      console.error('Error creating visit:', error);
      // TODO: Show error toast
    } finally {
      setIsCreatingVisit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.name}
            </h1>
            <p className="text-gray-400">
              Medical Representative Dashboard • Shadow MedTech AI
            </p>
          </div>
          <Button
            onClick={signout}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Sign Out
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Play className="w-8 h-8 text-blue-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">12</p>
                  <p className="text-gray-400 text-sm">Completed Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">85%</p>
                  <p className="text-gray-400 text-sm">Avg. Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-purple-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">8</p>
                  <p className="text-gray-400 text-sm">Scenarios Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="w-8 h-8 text-yellow-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">2</p>
                  <p className="text-gray-400 text-sm">Certifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Start New Visit */}
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Play className="w-6 h-6 mr-2 text-blue-400" />
                Start Training Session
              </CardTitle>
              <CardDescription className="text-gray-400">
                Begin a new interactive training session with AI-powered doctor simulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                onClick={createNewVisit}
                disabled={isCreatingVisit}
              >
                {isCreatingVisit ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Visit...
                  </>
                ) : (
                  'Start New Visit'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* View Progress */}
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-green-400" />
                View My Progress
              </CardTitle>
              <CardDescription className="text-gray-400">
                Review your performance analytics and improvement recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 py-3 text-lg font-semibold"
              >
                View Evaluations
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="backdrop-blur-md bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">
              Your latest training sessions and evaluations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for recent visits */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Cardiology Visit Simulation</p>
                    <p className="text-gray-400 text-sm">Completed 2 days ago • Score: 92%</p>
                  </div>
                </div>
                <Badge className="bg-green-600/20 text-green-400 border-green-400/20">
                  Completed
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Neurology Scenario</p>
                    <p className="text-gray-400 text-sm">Completed 1 week ago • Score: 88%</p>
                  </div>
                </div>
                <Badge className="bg-green-600/20 text-green-400 border-green-400/20">
                  Completed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
