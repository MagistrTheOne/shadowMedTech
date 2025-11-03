"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Stethoscope, Plus, Settings } from "lucide-react";

export default function TrainerDashboard() {
  const { user, signout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Trainer Dashboard
            </h1>
            <p className="text-gray-400">
              Manage scenarios, doctors, and training content • {user?.name}
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

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Plus className="w-6 h-6 mr-2 text-blue-400" />
                Create Scenario
              </CardTitle>
              <CardDescription className="text-gray-400">
                Add new training scenarios and medication cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                New Scenario
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Stethoscope className="w-6 h-6 mr-2 text-green-400" />
                Manage Doctors
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure AI doctor personalities and behaviors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                Doctor Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-6 h-6 mr-2 text-purple-400" />
                Team Analytics
              </CardTitle>
              <CardDescription className="text-gray-400">
                View training progress and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Content Management */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Scenarios */}
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="w-6 h-6 mr-2 text-blue-400" />
                Training Scenarios
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage medical training scenarios and cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Cardiology Case Study</p>
                    <p className="text-gray-400 text-sm">Advanced • 15 visits completed</p>
                  </div>
                  <Badge className="bg-green-600/20 text-green-400 border-green-400/20">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Neurology Consultation</p>
                    <p className="text-gray-400 text-sm">Intermediate • 8 visits completed</p>
                  </div>
                  <Badge className="bg-green-600/20 text-green-400 border-green-400/20">
                    Active
                  </Badge>
                </div>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 mt-4">
                  Manage All Scenarios
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Doctors */}
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Stethoscope className="w-6 h-6 mr-2 text-green-400" />
                AI Doctor Profiles
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure doctor personalities and interaction styles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Dr. Elena Vasiliev</p>
                    <p className="text-gray-400 text-sm">Rational • Empathy: 7/10</p>
                  </div>
                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-400/20">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Dr. Mikhail Petrov</p>
                    <p className="text-gray-400 text-sm">Demanding • Empathy: 4/10</p>
                  </div>
                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-400/20">
                    Active
                  </Badge>
                </div>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 mt-4">
                  Configure Doctors
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Training Stats */}
        <Card className="backdrop-blur-md bg-white/5 border-white/10 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Training Overview</CardTitle>
            <CardDescription className="text-gray-400">
              Current training session statistics and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">24</p>
                <p className="text-gray-400 text-sm">Active Scenarios</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">156</p>
                <p className="text-gray-400 text-sm">Completed Visits</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">82%</p>
                <p className="text-gray-400 text-sm">Avg. Team Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-gray-400 text-sm">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
