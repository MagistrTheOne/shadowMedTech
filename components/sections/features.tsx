"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  Volume2,
  Brain,
  FileText,
  BarChart3,
  Shield,
  CheckCircle
} from "lucide-react";

export function Features() {
  const features = [
    {
      icon: <Mic className="w-8 h-8 text-blue-400" />,
      title: "Advanced STT Integration",
      description: "Real-time speech-to-text conversion with medical terminology recognition and noise filtering optimized for pharmaceutical conversations.",
      badge: "Voice AI",
      benefits: ["99.5% accuracy", "Medical vocabulary", "Noise reduction"]
    },
    {
      icon: <Volume2 className="w-8 h-8 text-green-400" />,
      title: "Natural TTS Synthesis",
      description: "High-quality text-to-speech with multiple voice profiles simulating different doctor personalities and communication styles.",
      badge: "Synthesis",
      benefits: ["Multiple voices", "Emotional tone", "Natural pacing"]
    },
    {
      icon: <Brain className="w-8 h-8 text-purple-400" />,
      title: "AI Doctor Simulation",
      description: "GigaChat-powered doctor personalities with customizable empathy levels, communication styles, and medical knowledge bases.",
      badge: "AI Simulation",
      benefits: ["Personality types", "Medical knowledge", "Adaptive responses"]
    },
    {
      icon: <FileText className="w-8 h-8 text-orange-400" />,
      title: "Automated Evaluation",
      description: "Comprehensive visit evaluation with detailed feedback, scoring metrics, and personalized recommendations for improvement.",
      badge: "Evaluation",
      benefits: ["Instant feedback", "Detailed reports", "Improvement tips"]
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-cyan-400" />,
      title: "Analytics Dashboard",
      description: "Role-based analytics with progress tracking, skill development insights, and team performance metrics.",
      badge: "Analytics",
      benefits: ["Progress tracking", "Team insights", "Performance metrics"]
    },
    {
      icon: <Shield className="w-8 h-8 text-red-400" />,
      title: "Enterprise Security",
      description: "Data privacy and security compliant with medical industry standards, all data remains within company infrastructure.",
      badge: "Security",
      benefits: ["Data privacy", "Compliance", "Secure hosting"]
    }
  ];

  return (
    <section id="features" className="py-24 bg-linear-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-600/20 text-blue-400 border-blue-400/20">
            Core Features
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Next-Generation Medical Training
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive voice AI training platform designed specifically for pharmaceutical sales representatives,
            featuring realistic doctor simulations and automated performance evaluation.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                    {feature.icon}
                  </div>
                  <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-white text-xl mb-2">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-gray-400 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}
