import React from 'react';
import Navbar from './landing/Navbar';
import HeroSection from './landing/HeroSection';
import StatsBar from './landing/StatsBar';
import FeaturesSection from './landing/FeaturesSection';
import HowItWorksSection from './landing/HowItWorksSection';
import TestimonialsSection from './landing/TestimonialsSection';
import PricingSection from './landing/PricingSection';
import FaqSection from './landing/FaqSection';
import CtaSection from './landing/CtaSection';
import Footer from './landing/Footer';

interface LandingPageProps {
  onGoToSignUp: () => void;
  onGoToLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGoToSignUp, onGoToLogin }) => {
  return (
    <>
      {/* Skip to main content (accessibility) */}
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-slate-950 focus:rounded-xl focus:font-black focus:text-sm"
      >
        Skip to main content
      </a>

      <main id="main-content" className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
        <Navbar onGoToSignUp={onGoToSignUp} onGoToLogin={onGoToLogin} />
        <HeroSection onGoToSignUp={onGoToSignUp} onGoToLogin={onGoToLogin} />
        <StatsBar />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection onGoToSignUp={onGoToSignUp} />
        <FaqSection />
        <CtaSection onGoToSignUp={onGoToSignUp} />
        <Footer onGoToSignUp={onGoToSignUp} onGoToLogin={onGoToLogin} />
      </main>
    </>
  );
};

export default LandingPage;
