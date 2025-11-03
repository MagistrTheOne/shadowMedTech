"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, TrendingUp, FileText, Settings, Download } from "lucide-react";

export default function ManagerDashboard() {
  const { user, signout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Manager Dashboard
            </h1>
            <p className="text-slate-300">
              Team analytics, reports, and performance oversight • {user?.name}
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

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">24</p>
                  <p className="text-slate-300 text-sm">Active Reps</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-green-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">1,247</p>
                  <p className="text-slate-300 text-sm">Total Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-purple-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">78%</p>
                  <p className="text-slate-300 text-sm">Avg. Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-orange-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">156</p>
                  <p className="text-slate-300 text-sm">Reports Generated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-blue-400" />
                Team Analytics
              </CardTitle>
              <CardDescription className="text-slate-300">
                View detailed performance metrics and progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold">
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Download className="w-6 h-6 mr-2 text-green-400" />
                Generate Reports
              </CardTitle>
              <CardDescription className="text-slate-300">
                Create comprehensive training reports and export data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 py-3 text-lg font-semibold"
              >
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Top Performers</CardTitle>
              <CardDescription className="text-slate-300">
                Highest scoring team members this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 text-sm font-bold">AS</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Anna Smith</p>
                      <p className="text-slate-300 text-sm">Senior Rep</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600/20 text-green-400 border-green-400/20">
                    94% Avg
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                      <span className="text-purple-400 text-sm font-bold">MJ</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Mike Johnson</p>
                      <p className="text-slate-300 text-sm">Rep</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600/20 text-green-400 border-green-400/20">
                    91% Avg
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Areas for Improvement</CardTitle>
              <CardDescription className="text-slate-300">
                Common challenges and training opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-red-600/10 border border-red-400/20 rounded-lg">
                  <p className="text-white font-medium">Objection Handling</p>
                  <p className="text-slate-300 text-sm">Needs focus: 40% of reps</p>
                </div>
                <div className="p-3 bg-yellow-600/10 border border-yellow-400/20 rounded-lg">
                  <p className="text-white font-medium">Product Knowledge</p>
                  <p className="text-slate-300 text-sm">Room for improvement: 25% of reps</p>
                </div>
                <div className="p-3 bg-blue-600/10 border border-blue-400/20 rounded-lg">
                  <p className="text-white font-medium">Communication Skills</p>
                  <p className="text-slate-300 text-sm">Strong performance: 85% of reps</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
