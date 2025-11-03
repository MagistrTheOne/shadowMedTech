"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-linear-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-4 py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Shadow MedTech AI
            <span className="block text-2xl md:text-4xl text-gray-300 font-normal mt-2">
              Voice AI Training Simulator
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Next-generation voice AI training simulator that creates realistic dialogues with simulated doctors to train pharmaceutical sales representatives.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold"
            >
              <Link href="/dashboard">Start Training</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold"
            >
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
 
 

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Voice AI Training Card */}
            <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Voice AI Training
                </h3>
                <p className="text-gray-400 text-sm">
                  Realistic doctor simulations with advanced STT/TTS integration
                </p>
              </CardContent>
            </Card>

            {/* Real-time Evaluation Card */}
            <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Real-time Evaluation
                </h3>
                <p className="text-gray-400 text-sm">
                  Instant feedback and automated performance scoring
                </p>
              </CardContent>
            </Card>

            {/* Team Analytics Card */}
            <Card className="backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Team Analytics
                </h3>
                <p className="text-gray-400 text-sm">
                  Comprehensive progress tracking and skill development insights
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </section>
  );
}
