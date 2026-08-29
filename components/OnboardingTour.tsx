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

const TOUR_TRANSLATIONS: Record<string, {
  adminSteps: TourStep[];
  employeeSteps: TourStep[];
  stepText: string;
  ofText: string;
  skip: string;
  back: string;
  next: string;
  finish: string;
}> = {
  en: {
    adminSteps: ADMIN_STEPS,
    employeeSteps: EMPLOYEE_STEPS,
    stepText: 'Step',
    ofText: 'of',
    skip: 'Skip',
    back: '← Back',
    next: 'Next →',
    finish: '🎉 Finish',
  },
  ur: {
    adminSteps: [
      {
        targetId: 'dashboard-root',
        title: 'ٹرم ٹائم گلوبل میں خوش آمدید 🎉',
        content: 'یہ آپ کا کمانڈ سینٹر ہے۔ کاروبار چلانے کے لیے آپ کو درکار ہر چیز یہاں موجود ہے۔ آئیے ایک جائزہ لیں۔',
        position: 'center',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'tour-kpi-cards',
        title: 'براہِ راست میٹرکس',
        content: 'اپنی آمدنی، اخراجات، تنخواہیں اور انوینٹری کی قیمت ایک نظر میں دیکھیں۔ تمام نمبرز لائیو اپ ڈیٹ ہوتے ہیں۔',
        position: 'bottom',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'tour-revenue-chart',
        title: 'کارکردگی کی بصیرتیں',
        content: 'انٹرایکٹو چارٹس کے ذریعے کاروباری ترقی کا تجزیہ کریں۔ آج، ہفتہ، مہینہ، یا کسٹم رینج میں سوئچ کریں۔',
        position: 'top',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'tour-appointments',
        title: 'لائیو شیڈول',
        content: 'آج کی تمام تقرریاں یہاں نظر آتی ہیں — دیکھیں اگلا کون آ رہا ہے اور ریئل ٹائم میں اسٹیٹس چیک کریں۔',
        position: 'left',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'nav-pos',
        title: 'تیز رفتار چیک آؤٹ',
        content: 'پوائنٹ آف سیل (POS) سے تیزی سے بل بنائیں۔ نقد، کارڈ اور اسپلٹ ادائیگیوں کی سہولت۔',
        position: 'right'
      },
      {
        targetId: 'nav-appointments',
        title: 'بکنگ کیلنڈر',
        content: 'مکمل ٹیم کیلنڈر کے ساتھ کلائنٹ کی تمام تقرریوں کا شیڈول اور انتظام بنائیں۔',
        position: 'right'
      },
      {
        targetId: 'nav-customers',
        title: 'صارفین کی ڈائرکٹری',
        content: 'اپنے کلائنٹس، ان کی وزٹ ہسٹری، وفاداری پوائنٹس اور ترجیحات سب ایک جگہ ٹریک کریں۔',
        position: 'right'
      },
      {
        targetId: 'nav-inventory',
        title: 'مصنوعات اور خدمات',
        content: 'اپنے سروس مینو، ریٹیل آئٹمز، اسٹاک لیول اور سپلائر آرڈرز کا انتظام کریں۔',
        position: 'right'
      },
      {
        targetId: 'nav-finance',
        title: 'مالیاتی رپورٹس',
        content: 'آمدنی، اخراجات اور کمیشن ٹریک کریں، اور اکاؤنٹنگ کے لیے CSV رپورٹس ڈاؤن لوڈ کریں۔',
        position: 'right'
      },
      {
        targetId: 'nav-settings',
        title: 'دکان کی ترتیبات',
        content: 'اپنی کرنسی، ٹیکس، لائلٹی پروگرام اور اسٹاف لاگ ان لنکس کو سیٹنگز سے ایڈجسٹ کریں۔',
        position: 'right'
      }
    ],
    employeeSteps: [
      {
        targetId: 'dashboard-root',
        title: 'ٹیم میں خوش آمدید! 👋',
        content: 'آپ کا ذاتی ڈیش بورڈ آپ کی آنے والی تقرریاں اور آج کی کارکردگی دکھاتا ہے۔',
        position: 'center',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'tour-appointments',
        title: 'آپ کا شیڈول',
        content: 'دیکھیں کہ آپ کا اگلا کلائنٹ کون ہے۔ ہر کارڈ کلائنٹ، وقت اور اسٹیٹس دکھاتا ہے۔',
        position: 'top',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'nav-pos',
        title: 'فروخت شروع کریں',
        content: 'جب کلائنٹ ادائیگی کے لیے تیار ہو، POS ٹرمینل کھول کر چیک آؤٹ کریں۔',
        position: 'right'
      }
    ],
    stepText: 'مرحلہ',
    ofText: 'میں سے',
    skip: 'چھوڑیں',
    back: '← پیچھے',
    next: 'اگلا →',
    finish: '🎉 مکمل',
  },
  ar: {
    adminSteps: [
      {
        targetId: 'dashboard-root',
        title: 'مرحباً بك في TrimTime Global 🎉',
        content: 'هذا هو مركز التحكم الخاص بك. كل ما تحتاجه لإدارة عملك موجود هنا. لنلقِ نظرة سريعة.',
        position: 'center',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'tour-kpi-cards',
        title: 'المقاييس الفورية',
        content: 'تتبع إيراداتك ومصروفاتك ورواتبك وقيمة المخزون بنظرة واحدة. يتم تحديث كافة الأرقام مباشرة.',
        position: 'bottom',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'tour-revenue-chart',
        title: 'رؤى الأداء',
        content: 'حلل نمو الأعمال عبر الرسوم البيانية التفاعلية. بدل بين اليوم والأسبوع والشهر.',
        position: 'top',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'tour-appointments',
        title: 'الجدول المباشر',
        content: 'مواعيد اليوم مرئية دائماً هنا — اعرف العميل القادم وتتبع الحالات فوراً.',
        position: 'left',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'nav-pos',
        title: 'نقاط البيع السريعة',
        content: 'أنجز المبيعات بسرعة عبر محطة نقاط البيع مع دعم الدفع النقدي والبطاقات والدفع المقسم.',
        position: 'right'
      },
      {
        targetId: 'nav-appointments',
        title: 'تقويم الحجوزات',
        content: 'قم بجدولة وإدارة كافة مواعيد العملاء مع تقويم الفريق الكامل.',
        position: 'right'
      },
      {
        targetId: 'nav-customers',
        title: 'دليل العملاء',
        content: 'تتبع العملاء وسجل الزيارات ونقاط الولاء وتفضيلاتهم في مكان واحد.',
        position: 'right'
      },
      {
        targetId: 'nav-inventory',
        title: 'المنتجات والخدمات',
        content: 'أدر قائمة الخدمات ومنتجات التجزئة ومستويات المخزون وطلبات الموردين.',
        position: 'right'
      },
      {
        targetId: 'nav-finance',
        title: 'التقارير المالية',
        content: 'تتبع الإيرادات والمصروفات وعمولات الموظفين ونزّل تقارير CSV للمحاسبة.',
        position: 'right'
      },
      {
        targetId: 'nav-settings',
        title: 'إعدادات المتجر',
        content: 'اضبط عملتك والضرائب وبرنامج الولاء وروابط دخول الموظفين من الإعدادات.',
        position: 'right'
      }
    ],
    employeeSteps: [
      {
        targetId: 'dashboard-root',
        title: 'مرحباً بك في الفريق! 👋',
        content: 'تعرض لوحة القيادة الشخصية مواعيدك القادمة وأداءك اليومي بنظرة سريعة.',
        position: 'center',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'tour-appointments',
        title: 'جدولك الخاص',
        content: 'اعرف من هو عميلك القادم. تظهر كل بطاقة اسم العميل والوقت والحالة.',
        position: 'top',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'nav-pos',
        title: 'بدء عملية بيع',
        content: 'عندما يصبح العميل جاهزاً للدفع، انتقل إلى نقطة البيع POS لإتمام الحساب.',
        position: 'right'
      }
    ],
    stepText: 'خطوة',
    ofText: 'من',
    skip: 'تخطي',
    back: '← السابق',
    next: 'التالي →',
    finish: '🎉 إنهاء',
  },
  hi: {
    adminSteps: [
      {
        targetId: 'dashboard-root',
        title: 'TrimTime Global में आपका स्वागत है 🎉',
        content: 'यह आपका कमांड सेंटर है। अपने व्यवसाय को चलाने के लिए आवश्यक सभी चीजें यहां हैं। आइए एक त्वरित नज़र डालें।',
        position: 'center',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'tour-kpi-cards',
        title: 'रीयल-टाइम मेट्रिक्स',
        content: 'अपने राजस्व, व्यय, पेरोल और इन्वेंट्री मूल्य को एक नज़र में ट्रैक करें। सभी नंबर लाइव अपडेट होते हैं।',
        position: 'bottom',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'tour-revenue-chart',
        title: 'प्रदर्शन अंतर्दृष्टि',
        content: 'इंटरैक्टिव चार्ट के साथ व्यवसाय के विकास का विश्लेषण करें। आज, सप्ताह, महीने या कस्टम में स्विच करें।',
        position: 'top',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'tour-appointments',
        title: 'लाइव शेड्यूल',
        content: 'आज के अपॉइंटमेंट हमेशा यहां दिखाई देते हैं — देखें कि आगे कौन आ रहा है और स्थिति ट्रैक करें।',
        position: 'left',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'nav-pos',
        title: 'तेज़ चेकआउट',
        content: 'पीओएस टर्मिनल के साथ तेजी से बिक्री पूरी करें। नकद, कार्ड और विभाजित भुगतान का समर्थन करता है।',
        position: 'right'
      },
      {
        targetId: 'nav-appointments',
        title: 'बुकिंग कैलेंडर',
        content: 'पूरी टीम कैलेंडर के साथ सभी ग्राहक अपॉइंटमेंट को शेड्यूल और प्रबंधित करें।',
        position: 'right'
      },
      {
        targetId: 'nav-customers',
        title: 'ग्राहक निर्देशिका',
        content: 'अपने ग्राहकों, उनके विज़िट इतिहास, लॉयल्टी पॉइंट और प्राथमिकताओं को एक ही स्थान पर ट्रैक करें।',
        position: 'right'
      },
      {
        targetId: 'nav-inventory',
        title: 'उत्पाद और सेवाएं',
        content: 'अपनी सेवा सूची, खुदरा उत्पाद, स्टॉक स्तर और आपूर्तिकर्ता ऑर्डर प्रबंधित करें।',
        position: 'right'
      },
      {
        targetId: 'nav-finance',
        title: 'वित्तीय रिपोर्ट',
        content: 'राजस्व, व्यय, स्टाफ कमीशन ट्रैक करें और लेखांकन के लिए सीएसवी रिपोर्ट डाउनलोड करें।',
        position: 'right'
      },
      {
        targetId: 'nav-settings',
        title: 'दुकान कॉन्फ़िगर करें',
        content: 'सेटिंग्स से अपनी मुद्रा, कर, लॉयल्टी प्रोग्राम और स्टाफ लॉगिन लिंक सेट करें।',
        position: 'right'
      }
    ],
    employeeSteps: [
      {
        targetId: 'dashboard-root',
        title: 'टीम में आपका स्वागत है! 👋',
        content: 'आपका व्यक्तिगत डैशबोर्ड आपके आगामी अपॉइंटमेंट और आज का प्रदर्शन दिखाता है।',
        position: 'center',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'tour-appointments',
        title: 'आपका शेड्यूल',
        content: 'देखें कि आपका अगला ग्राहक कौन है। प्रत्येक कार्ड ग्राहक, समय और स्थिति दिखाता है।',
        position: 'top',
        requiresRoute: '/dashboard'
      },
      {
        targetId: 'nav-pos',
        title: 'बिक्री शुरू करें',
        content: 'जब ग्राहक भुगतान के लिए तैयार हो, तो चेकआउट करने के लिए पीओएस टर्मिनल पर जाएं।',
        position: 'right'
      }
    ],
    stepText: 'कदम',
    ofText: 'में से',
    skip: 'छोड़ें',
    back: '← पीछे',
    next: 'आगे →',
    finish: '🎉 समाप्त',
  }
};

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
  const { currentUser, isTourCompleted, completeTour, sessionLanguage } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const langKey = sessionLanguage && TOUR_TRANSLATIONS[sessionLanguage] ? sessionLanguage : 'en';
  const tourT = TOUR_TRANSLATIONS[langKey];
  const steps = currentUser?.role === 'admin' ? tourT.adminSteps : tourT.employeeSteps;
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
        <div className="fixed z-[1002] pointer-events-none" style={getTooltipStyles()}>
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full bg-[var(--tt-surface)] border border-[var(--tt-border)] p-6 rounded-3xl shadow-2xl pointer-events-auto shadow-black/40"
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
            {tourT.stepText} {currentStepIndex + 1} {tourT.ofText} {steps.length}
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
              className="text-[10px] font-black text-[var(--tt-text-muted)] hover:text-[var(--tt-rose)] uppercase tracking-widest transition-colors cursor-pointer"
            >
              {tourT.skip}
            </button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 text-[10px] font-black text-[var(--tt-text-muted)] hover:text-[var(--tt-text-main)] uppercase tracking-widest bg-[var(--tt-surface-2)] rounded-xl transition-colors cursor-pointer"
                >
                  {tourT.back}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                {currentStepIndex === steps.length - 1 ? tourT.finish : tourT.next}
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
        </div>
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default OnboardingTour;
