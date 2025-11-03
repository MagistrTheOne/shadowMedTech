"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, Star, TrendingUp, Award } from 'lucide-react';

interface Evaluation {
  id: string;
  score: number;
  feedback: string;
  recommendations: string[];
  metrics: any;
  createdAt: string;
  visit: {
    id: string;
    scenario: {
      title: string;
    };
    doctor: {
      name: string;
    };
  };
}

export default function EvaluationsPage() {
  const { user, signout } = useAuth();
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadEvaluations();
    }
  }, [user]);

  const loadEvaluations = async () => {
    try {
      const response = await fetch('/api/evaluations');
      if (!response.ok) throw new Error('Failed to load evaluations');

      const data = await response.json();
      setEvaluations(data.evaluations);
    } catch (err) {
      console.error('Error loading evaluations:', err);
      setError('Не удалось загрузить оценки');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'bg-green-600/20 text-green-400 border-green-400/20';
    if (score >= 70) return 'bg-yellow-600/20 text-yellow-400 border-yellow-400/20';
    return 'bg-red-600/20 text-red-400 border-red-400/20';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user || user.role !== 'rep') {
    router.push('/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/rep')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">My Evaluations</h1>
              <p className="text-gray-400">
                Performance feedback and improvement recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {evaluations.length > 0 && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="backdrop-blur-md bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Award className="w-8 h-8 text-blue-400 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {evaluations.length}
                    </p>
                    <p className="text-gray-400 text-sm">Total Evaluations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Star className="w-8 h-8 text-yellow-400 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(evaluations.reduce((acc, evaluation) => acc + evaluation.score, 0) / evaluations.length) || 0}%
                    </p>
                    <p className="text-gray-400 text-sm">Average Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-green-400 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {evaluations.filter(evaluation => evaluation.score >= 90).length}
                    </p>
                    <p className="text-gray-400 text-sm">Excellent Scores</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-400 text-sm font-bold">AI</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">GigaChat</p>
                    <p className="text-gray-400 text-sm">AI-Powered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Evaluations List */}
        <div className="space-y-6">
          {error && (
            <Card className="backdrop-blur-md bg-red-600/10 border-red-400/20">
              <CardContent className="p-6">
                <p className="text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {evaluations.length === 0 && !error && (
            <Card className="backdrop-blur-md bg-white/5 border-white/10">
              <CardContent className="p-12 text-center">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Evaluations Yet</h3>
                <p className="text-gray-400 mb-6">
                  Complete your first training visit to receive AI-powered evaluation feedback.
                </p>
                <Button onClick={() => router.push('/rep')} className="bg-blue-600 hover:bg-blue-700">
                  Start Training
                </Button>
              </CardContent>
            </Card>
          )}

          {evaluations.map((evaluation) => (
            <Card
              key={evaluation.id}
              className="backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white text-xl mb-2">
                      {evaluation.visit.scenario.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      with Dr. {evaluation.visit.doctor.name} • {new Date(evaluation.createdAt).toLocaleDateString('ru-RU')}
                    </CardDescription>
                  </div>
                  <Badge className={getScoreBadgeVariant(evaluation.score)}>
                    <Star className="w-3 h-3 mr-1" />
                    {evaluation.score}/100
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Score Breakdown */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Performance Score</h4>
                      <div className="flex items-center space-x-2">
                        <div className={`text-3xl font-bold ${getScoreColor(evaluation.score)}`}>
                          {evaluation.score}%
                        </div>
                        <div className="text-gray-400 text-sm">
                          {evaluation.score >= 90 ? 'Excellent' :
                           evaluation.score >= 80 ? 'Good' :
                           evaluation.score >= 70 ? 'Satisfactory' : 'Needs Improvement'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-semibold mb-2">AI Analysis</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {evaluation.feedback}
                      </p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {evaluation.recommendations && evaluation.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-white font-semibold mb-3">Recommendations</h4>
                      <div className="space-y-2">
                        {evaluation.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0" />
                            <p className="text-gray-300 text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
