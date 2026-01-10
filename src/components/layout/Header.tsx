import { Link } from 'react-router-dom';
import { Menu, X, User, MessageSquare, Calendar, Globe } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bg' : 'en');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <span className="text-lg font-bold text-primary-foreground">S</span>
          </div>
          <span className="text-xl font-bold text-foreground">SportCoach</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/coaches">
            <Button variant="ghost" size="sm">
              {t.nav.browse}
            </Button>
          </Link>
          <Link to="/categories">
            <Button variant="ghost" size="sm">
              {t.nav.categories}
            </Button>
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Language Switcher */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLanguage}
            className="gap-1.5"
          >
            <Globe className="h-4 w-4" />
            {language.toUpperCase()}
          </Button>

          <Link to="/bookings">
            <Button variant="ghost" size="icon">
              <Calendar className="h-5 w-5" />
            </Button>
          </Link>

          <Link to="/messages">
            <Button variant="ghost" size="icon">
              <MessageSquare className="h-5 w-5" />
            </Button>
          </Link>

          <div className="mx-2 h-6 w-px bg-border" />

          <Link to="/auth/signin">
            <Button variant="ghost" size="sm">
              {t.nav.signIn}
            </Button>
          </Link>

          <Link to="/auth/signup">
            <Button variant="default" size="sm">
              {t.nav.signUp}
            </Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <div className="container space-y-3 py-4">
            <Link to="/coaches" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                {t.nav.browse}
              </Button>
            </Link>
            <Link to="/categories" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                {t.nav.categories}
              </Button>
            </Link>
            <Link to="/bookings" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4" />
                {t.nav.myBookings}
              </Button>
            </Link>
            <Link to="/messages" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <MessageSquare className="h-4 w-4" />
                {t.nav.messages}
              </Button>
            </Link>

            <div className="my-2 h-px bg-border" />

            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={toggleLanguage}
            >
              <Globe className="h-4 w-4" />
              {language === 'en' ? 'Български' : 'English'}
            </Button>

            <div className="flex gap-2">
              <Link to="/auth/signin" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  {t.nav.signIn}
                </Button>
              </Link>
              <Link to="/auth/signup" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">
                  {t.nav.signUp}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
