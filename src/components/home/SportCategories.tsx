import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, Target, Trophy, Bike, Waves, 
  Heart, Zap, Mountain, Users
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const sportIcons: Record<string, React.ReactNode> = {
  fitness: <Dumbbell className="h-6 w-6" />,
  boxing: <Target className="h-6 w-6" />,
  tennis: <Trophy className="h-6 w-6" />,
  cycling: <Bike className="h-6 w-6" />,
  swimming: <Waves className="h-6 w-6" />,
  yoga: <Heart className="h-6 w-6" />,
  crossfit: <Zap className="h-6 w-6" />,
  climbing: <Mountain className="h-6 w-6" />,
};

const featuredSports = ['fitness', 'boxing', 'yoga', 'tennis', 'swimming', 'crossfit', 'cycling', 'climbing'];

export function SportCategories() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  return (
    <section className="py-16">
      <div className="container">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold">{t.nav.categories}</h2>
          <p className="text-muted-foreground">
            {language === 'bg' ? 'Изберете спорт и намерете треньор' : 'Choose a sport and find your coach'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
          {featuredSports.map((sport) => (
            <button
              key={sport}
              onClick={() => navigate(`/coaches?sport=${sport}`)}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {sportIcons[sport] || <Users className="h-6 w-6" />}
              </div>
              <span className="text-sm font-medium">
                {t.sports[sport as keyof typeof t.sports]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
