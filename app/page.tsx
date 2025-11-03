import { Navigation } from "@/components/layout/navigation";
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { Pricing } from "@/components/sections/pricing";
import { SignupForm } from "@/components/auth/signup-form";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-black via-gray-900 to-black">
      <Navigation />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Footer />
      </main>
    </div>
  );
}
