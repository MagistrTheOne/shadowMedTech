import { Navigation } from "@/components/layout/navigation";
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { Pricing } from "@/components/sections/pricing";
import { SignupForm } from "@/components/auth/signup-form";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navigation />
      <main>
        <Hero />
        <Features />
        <Pricing />

        {/* Signup Section */}
        <section className="py-24 bg-gradient-to-b from-slate-800 to-slate-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Training?
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Join hundreds of pharmaceutical sales teams already using Shadow MedTech AI
                to master their craft with realistic doctor simulations.
              </p>
            </div>
            <SignupForm />
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
