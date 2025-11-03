"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Settings, Shield, Database, Activity, Key } from "lucide-react";

export default function AdminDashboard() {
  const { user, signout } = useAuth();

  return (
    <div className="min-h-screen bg-linear-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-slate-300">
              System administration, user management, and configuration • {user?.name}
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

        {/* System Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">156</p>
                  <p className="text-slate-300 text-sm">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="w-8 h-8 text-green-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">12</p>
                  <p className="text-slate-300 text-sm">Companies</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-purple-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">2,847</p>
                  <p className="text-slate-300 text-sm">Total Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-orange-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">99.9%</p>
                  <p className="text-slate-300 text-sm">Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-6 h-6 mr-2 text-blue-400" />
                User Management
              </CardTitle>
              <CardDescription className="text-slate-300">
                Manage users, roles, and permissions across all companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Manage Users
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="w-6 h-6 mr-2 text-green-400" />
                System Settings
              </CardTitle>
              <CardDescription className="text-slate-300">
                Configure system parameters, API keys, and global settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                System Config
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="w-6 h-6 mr-2 text-purple-400" />
                System Logs
              </CardTitle>
              <CardDescription className="text-slate-300">
                Monitor system activity, errors, and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                View Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Security */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Recent User Activity</CardTitle>
              <CardDescription className="text-slate-300">
                Latest user registrations and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">New user registration</p>
                    <p className="text-slate-300 text-sm">john.doe@pharmaco.com • 2 hours ago</p>
                  </div>
                  <Badge className="bg-green-600/20 text-green-400 border-green-400/20">
                    User
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Company created</p>
                    <p className="text-slate-300 text-sm">BioTech Solutions • 4 hours ago</p>
                  </div>
                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-400/20">
                    Company
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Failed login attempt</p>
                    <p className="text-slate-300 text-sm">unknown@external.com • 6 hours ago</p>
                  </div>
                  <Badge className="bg-red-600/20 text-red-400 border-red-400/20">
                    Security
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">System Health</CardTitle>
              <CardDescription className="text-slate-300">
                Database, API, and service status monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-600/10 border border-green-400/20 rounded-lg">
                  <div className="flex items-center">
                    <Database className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-white">Database</span>
                  </div>
                  <Badge className="bg-green-600/20 text-green-400 border-green-400/20">
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-600/10 border border-green-400/20 rounded-lg">
                  <div className="flex items-center">
                    <Key className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-white">GigaChat API</span>
                  </div>
                  <Badge className="bg-green-600/20 text-green-400 border-green-400/20">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-600/10 border border-yellow-400/20 rounded-lg">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-yellow-400 mr-3" />
                    <span className="text-white">SSL Certificates</span>
                  </div>
                  <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-400/20">
                    Expires Soon
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
