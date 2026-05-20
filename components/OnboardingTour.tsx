import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  requiresRoute?: string; // navigate here before showing
}

const ADMIN_STEPS: TourStep[] = [
  {
    targetId: 'dashboard-root',
    title: 'Welcome to TrimTime Global 🎉',
    content: 'This is your Command Center. Everything you need to run your business lives here. Let\'s take a quick look around.',
    position: 'center',
    requiresRoute: '/dashboard'
  },
  {
    targetId: 'tour-kpi-cards',
    title: 'Real-time Metrics',
    content: 'Track your revenue, expenses, payroll, and inventory value at a glance. All numbers update live.',
    position: 'bottom',
    requiresRoute: '/dashboard'
  },
  {
    targetId: 'tour-revenue-chart',
    title: 'Performance Insights',
    content: 'Analyze business growth over time with interactive trend charts. Switch between Today, Week, Month, or custom ranges.',
    position: 'top',
    requiresRoute: '/dashboard'
  },
  {
    targetId: 'tour-appointments',
    title: 'Live Schedule',
    content: 'Today\'s appointments are always visible here — see who\'s coming next and track statuses in real-time.',
    position: 'left',
    requiresRoute: '/dashboard'
  },
  {
    targetId: 'nav-pos',
    title: 'Fast Checkout',
    content: 'Process sales quickly with the Point of Sale terminal. Supports cash, card, and split payments.',
    position: 'right'
  },
  {
    targetId: 'nav-appointments',
    title: 'Booking Calendar',
    content: 'Schedule and manage all client appointments with your full team calendar.',
    position: 'right'
  },
  {
    targetId: 'nav-customers',
    title: 'Customer Directory',
    content: 'Track your clients, their visit history, loyalty points, and preferences all in one place.',
    position: 'right'
  },
  {
    targetId: 'nav-inventory',
    title: 'Products & Services',
    content: 'Manage your service menu, retail products, stock levels, and supplier orders.',
    position: 'right'
  },
  {
    targetId: 'nav-finance',
    title: 'Financial Reports',
    content: 'Track revenue, expenses, staff commissions, and download CSV reports for accounting.',
    position: 'right'
  },
  {
    targetId: 'nav-settings',
    title: 'Configure Your Shop',
    content: 'Set your currency, tax, loyalty program, staff login links, and more from Settings.',
    position: 'right'
  }
];

const EMPLOYEE_STEPS: TourStep[] = [
  {
    targetId: 'dashboard-root',
    title: 'Welcome to the Team! 👋',
    content: 'Your personal dashboard shows your upcoming appointments and today\'s performance at a glance.',
    position: 'center',
    requiresRoute: '/dashboard'
  },
  {
    targetId: 'tour-appointments',
    title: 'Your Schedule',
    content: 'See exactly who you\'re seeing next. Each card shows the client, time, and status.',
    position: 'top',
    requiresRoute: '/dashboard'
  },
  {
    targetId: 'nav-pos',
    title: 'Start a Sale',
    content: 'When a client is ready to pay, head to the POS Terminal to process their checkout.',
    position: 'right'
  }
];

/**
 * Attempts to find a DOM element by ID with retry logic.
 * Returns the element's bounding rect or null if not found after retries.
 */
const findElementWithRetry = (
  id: string,
  callback: (rect: DOMRect | null) => void,
  retries = 3,
  delay = 400
) => {
  const el = document.getElementById(id);
  if (el) {
    callback(el.getBoundingClientRect());
    return;
  }
  if (retries > 0) {
    setTimeout(() => findElementWithRetry(id, callback, retries - 1, delay + 200), delay);
  } else {
    // Element not found after all retries — show as center tooltip
    callback(null);
  }
};

const OnboardingTour: React.FC = () => {
  const { currentUser, isTourCompleted, completeTour } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const steps = currentUser?.role === 'admin' ? ADMIN_STEPS : EMPLOYEE_STEPS;
  const currentStep = steps[currentStepIndex];

  // Reset index when tour restarts
  useEffect(() => {
    if (!isTourCompleted) {
      setCurrentStepIndex(0);
    }
  }, [isTourCompleted]);

  // Listen for restart-onboarding event
  useEffect(() => {
    const handleRestart = () => {
      setCurrentStepIndex(0);
    };
    window.addEventListener('restart-onboarding', handleRestart);
    return () => window.removeEventListener('restart-onboarding', handleRestart);
  }, []);

  // Navigate to required route when step changes
  useEffect(() => {
    if (isTourCompleted || !currentStep) return;
    if (currentStep.requiresRoute && location.pathname !== currentStep.requiresRoute) {
      navigate(currentStep.requiresRoute, { replace: true });
    }
  }, [currentStepIndex, isTourCompleted]); // eslint-disable-line

  // Update spotlight rect when route or step changes — with retry logic
  useEffect(() => {
    if (isTourCompleted || !currentStep) return;

    const updateRect = () => {
      findElementWithRetry(currentStep.targetId, (rect) => {
        setTargetRect(rect);
      });
    };

    // Delay to allow route transition to complete
    const timer = setTimeout(updateRect, 300);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    const interval = setInterval(updateRect, 600);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      clearInterval(interval);
    };
  }, [currentStepIndex, isTourCompleted, location.pathname, currentStep?.targetId]);

  if (isTourCompleted || !currentUser) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(s => s + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) setCurrentStepIndex(s => s - 1);
  };

  const getTooltipStyles = (): React.CSSProperties => {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      const mobileWidth = 'calc(100vw - 32px)';
      if (!targetRect || currentStep.position === 'center') {
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: mobileWidth };
      }
      // On mobile, avoid target by placing tooltip on opposite half of screen
      const targetCenterY = targetRect.top + targetRect.height / 2;
      const isInBottomHalf = targetCenterY > window.innerHeight / 2;
      
      if (isInBottomHalf) {
        return { top: '24px', left: '50%', transform: 'translateX(-50%)', width: mobileWidth };
      } else {
        return { bottom: '24px', left: '50%', transform: 'translateX(-50%)', width: mobileWidth };
      }
    }

    // Desktop positioning
    const boxW = 320;
    if (!targetRect || currentStep.position === 'center') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: boxW };
    }

    const margin = 20;
    const boxH = 240; // Approx height to prevent vertical cutoff
    
    // Bounds checking functions to keep tooltip fully on screen
    const safeTop = (idealTop: number) => Math.max(16, Math.min(idealTop, window.innerHeight - boxH - 16));
    const safeLeft = (idealLeft: number) => Math.max(16, Math.min(idealLeft, window.innerWidth - boxW - 16));

    switch (currentStep.position) {
      case 'bottom':
        return { top: safeTop(targetRect.bottom + margin), left: safeLeft(targetRect.left + targetRect.width / 2 - boxW / 2), width: boxW };
      case 'top':
        return { bottom: Math.max(16, window.innerHeight - targetRect.top + margin), left: safeLeft(targetRect.left + targetRect.width / 2 - boxW / 2), width: boxW };
      case 'left':
        return { top: safeTop(targetRect.top + targetRect.height / 2 - boxH / 2), right: Math.max(16, window.innerWidth - targetRect.left + margin), width: boxW };
      case 'right':
        return { top: safeTop(targetRect.top + targetRect.height / 2 - boxH / 2), left: safeLeft(targetRect.right + margin), width: boxW };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: boxW };
    }
  };

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return createPortal(
    <div className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden no-print">
      {/* Dimmed Overlay — clickable to skip */}
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] pointer-events-auto transition-all duration-500"
        style={{
          clipPath: targetRect && currentStep.position !== 'center'
            ? `polygon(0% 0%, 0% 100%, ${targetRect.left - 4}px 100%, ${targetRect.left - 4}px ${targetRect.top - 4}px, ${targetRect.right + 4}px ${targetRect.top - 4}px, ${targetRect.right + 4}px ${targetRect.bottom + 4}px, ${targetRect.left - 4}px ${targetRect.bottom + 4}px, ${targetRect.left - 4}px 100%, 100% 100%, 100% 0%)`
            : undefined
        }}
        onClick={() => completeTour()}
      />

      {/* Spotlight Border Beacon */}
      {targetRect && currentStep.position !== 'center' && (
        <div
          className="fixed pointer-events-none tour-beacon"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            border: '2px solid var(--tt-amber)',
            borderRadius: '20px',
            zIndex: 1001
          }}
        />
      )}

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={getTooltipStyles()}
          className="fixed z-[1002] bg-[var(--tt-surface)] border border-[var(--tt-border)] p-6 rounded-3xl shadow-2xl pointer-events-auto shadow-black/40"
        >
          {/* Step number + title */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-[var(--tt-amber)] rounded-xl flex items-center justify-center text-slate-950 font-black text-xs shrink-0">
              {currentStepIndex + 1}
            </div>
            <h4 className="text-base font-black text-[var(--tt-text-main)] tracking-tight leading-tight">{currentStep.title}</h4>
          </div>

          {/* Step counter */}
          <p className="text-[10px] font-bold text-[var(--tt-text-muted)] uppercase tracking-widest mb-3 ml-11">
            Step {currentStepIndex + 1} of {steps.length}
          </p>

          {/* Content */}
          <p className="text-sm text-[var(--tt-text-muted)] leading-relaxed mb-5">
            {currentStep.content}
          </p>

          {/* Progress bar */}
          <div className="h-1 bg-[var(--tt-surface-2)] rounded-full mb-5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => completeTour()}
              className="text-[10px] font-black text-[var(--tt-text-muted)] hover:text-[var(--tt-rose)] uppercase tracking-widest transition-colors"
            >
              Skip
            </button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 text-[10px] font-black text-[var(--tt-text-muted)] hover:text-[var(--tt-text-main)] uppercase tracking-widest bg-[var(--tt-surface-2)] rounded-xl transition-colors"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                {currentStepIndex === steps.length - 1 ? '🎉 Finish' : 'Next →'}
              </button>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex gap-1.5 mt-5 justify-center">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`rounded-full transition-all duration-300 ${idx === currentStepIndex ? 'w-4 h-1.5 bg-[var(--tt-amber)]' : 'w-1.5 h-1.5 bg-[var(--tt-surface-2)] hover:bg-[var(--tt-text-muted)]'}`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default OnboardingTour;
