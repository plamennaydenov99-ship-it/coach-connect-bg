import { Search, Calendar, CreditCard, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const steps = [
  {
    icon: Search,
    titleEn: 'Find Your Coach',
    titleBg: 'Намери треньор',
    descEn: 'Search by sport, location, and price. Filter by availability and ratings.',
    descBg: 'Търси по спорт, локация и цена. Филтрирай по наличност и оценки.',
  },
  {
    icon: Calendar,
    titleEn: 'Book Instantly',
    titleBg: 'Резервирай мигновено',
    descEn: 'Pick a time slot that works for you. Confirm with one click.',
    descBg: 'Избери удобен час. Потвърди с един клик.',
  },
  {
    icon: CreditCard,
    titleEn: 'Pay Securely',
    titleBg: 'Плати сигурно',
    descEn: 'Pay online with card, ePay.bg, or Revolut. Your payment is protected.',
    descBg: 'Плати онлайн с карта, ePay.bg или Revolut. Плащането е защитено.',
  },
  {
    icon: Star,
    titleEn: 'Train & Review',
    titleBg: 'Тренирай и оцени',
    descEn: 'Enjoy your session and share your experience to help others.',
    descBg: 'Насладете се на тренировката и споделете впечатления.',
  },
];

export function HowItWorks() {
  const { language } = useLanguage();

  return (
    <section className="py-16">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold">
            {language === 'bg' ? 'Как работи' : 'How It Works'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'bg' 
              ? 'Започнете тренировка в 4 лесни стъпки' 
              : 'Start training in 4 easy steps'}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              {/* Step number */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </div>

              {/* Icon */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
                <step.icon className="h-7 w-7 text-accent-foreground" />
              </div>

              {/* Content */}
              <h3 className="mb-2 text-lg font-semibold">
                {language === 'bg' ? step.titleBg : step.titleEn}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'bg' ? step.descBg : step.descEn}
              </p>

              {/* Connector line (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-8 hidden h-0.5 w-full translate-x-1/2 bg-border lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
