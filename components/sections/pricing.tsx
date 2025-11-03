"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

export function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$49",
      period: "per user/month",
      description: "Perfect for small pharmaceutical teams getting started with AI training",
      features: [
        "Up to 50 medical reps",
        "Basic doctor simulations",
        "Standard evaluation reports",
        "Email support",
        "Basic analytics",
        "Mobile access"
      ],
      popular: false,
      buttonText: "Start Free Trial",
      buttonVariant: "outline" as const
    },
    {
      name: "Professional",
      price: "$99",
      period: "per user/month",
      description: "Advanced training platform for growing pharmaceutical organizations",
      features: [
        "Up to 200 medical reps",
        "Advanced AI doctor personalities",
        "Detailed evaluation metrics",
        "Priority support",
        "Advanced analytics & reporting",
        "Custom scenarios",
        "API access",
        "Team management"
      ],
      popular: true,
      buttonText: "Start Free Trial",
      buttonVariant: "default" as const
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing available",
      description: "Complete AI training solution for large pharmaceutical companies",
      features: [
        "Unlimited medical reps",
        "Custom doctor simulations",
        "Advanced evaluation algorithms",
        "24/7 dedicated support",
        "Enterprise analytics",
        "Custom integrations",
        "On-premise deployment",
        "Training program design",
        "Compliance reporting"
      ],
      popular: false,
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-600/20 text-purple-400 border-purple-400/20">
            SaaS Pricing
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Choose Your Training Solution
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Flexible per-user licensing designed for pharmaceutical companies of all sizes.
            Start training your sales team with AI-powered medical simulations today.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative backdrop-blur-md border-white/10 hover:border-white/20 transition-all duration-300 ${
                plan.popular
                  ? "bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-400/30 scale-105"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-1">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl text-white mb-2">
                  {plan.name}
                </CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 ml-2">{plan.period}</span>
                </div>
                <CardDescription className="text-gray-400 leading-relaxed">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      : "border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                  }`}
                  variant={plan.buttonVariant}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <Card className="backdrop-blur-md bg-white/5 border-white/10 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-white mb-4">
                Enterprise Solutions
              </h3>
              <p className="text-slate-300 mb-6">
                Need custom pricing or specialized features for your pharmaceutical training program?
                Our enterprise solutions include on-premise deployment, custom integrations, and dedicated support.
              </p>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 hover:border-white/30"
              >
                Schedule Demo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 mb-8">Trusted by leading pharmaceutical companies</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            {/* Placeholder for company logos */}
            <div className="text-white/50 font-semibold text-lg">Pfizer</div>
            <div className="text-white/50 font-semibold text-lg">Johnson & Johnson</div>
            <div className="text-white/50 font-semibold text-lg">Merck</div>
            <div className="text-white/50 font-semibold text-lg">Novartis</div>
            <div className="text-white/50 font-semibold text-lg">GSK</div>
          </div>
        </div>
      </div>
    </section>
  );
}
