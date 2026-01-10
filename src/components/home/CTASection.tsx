import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function CTASection() {
  const { t, language } = useLanguage();

  return (
    <section className="py-16">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl hero-gradient p-8 md:p-12">
          {/* Decorative */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
            {/* For Clients */}
            <div className="text-center lg:text-left">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                {language === 'bg' 
                  ? 'Готови ли сте за първата тренировка?' 
                  : 'Ready for your first session?'}
              </h2>
              <p className="mb-6 text-lg text-white/80">
                {language === 'bg'
                  ? 'Намерете треньор още днес и започнете своето фитнес пътешествие.'
                  : 'Find a coach today and start your fitness journey.'}
              </p>
              <Link to="/coaches">
                <Button 
                  size="lg" 
                  className="gap-2 bg-white text-primary hover:bg-white/90"
                >
                  {language === 'bg' ? 'Търси треньори' : 'Browse Coaches'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* For Coaches */}
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm lg:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                {t.nav.becomeCoach}
              </h3>
              <p className="mb-4 text-white/80">
                {language === 'bg'
                  ? 'Присъединете се към платформата и достигнете до повече клиенти.'
                  : 'Join our platform and reach more clients than ever.'}
              </p>
              <Link to="/coach/register">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  {language === 'bg' ? 'Научете повече' : 'Learn More'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
