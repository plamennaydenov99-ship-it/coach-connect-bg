import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { language } = useLanguage();

  const footerLinks = {
    explore: {
      title: language === 'bg' ? 'Разгледай' : 'Explore',
      links: [
        { label: language === 'bg' ? 'Всички треньори' : 'All Coaches', href: '/coaches' },
        { label: language === 'bg' ? 'Категории' : 'Categories', href: '/categories' },
        { label: language === 'bg' ? 'Градове' : 'Cities', href: '/cities' },
      ],
    },
    coaches: {
      title: language === 'bg' ? 'За треньори' : 'For Coaches',
      links: [
        { label: language === 'bg' ? 'Стани треньор' : 'Become a Coach', href: '/coach/register' },
        { label: language === 'bg' ? 'Ресурси' : 'Resources', href: '/resources' },
        { label: language === 'bg' ? 'Цени' : 'Pricing', href: '/pricing' },
      ],
    },
    company: {
      title: language === 'bg' ? 'Компания' : 'Company',
      links: [
        { label: language === 'bg' ? 'За нас' : 'About Us', href: '/about' },
        { label: language === 'bg' ? 'Блог' : 'Blog', href: '/blog' },
        { label: language === 'bg' ? 'Контакти' : 'Contact', href: '/contact' },
      ],
    },
    legal: {
      title: language === 'bg' ? 'Правна информация' : 'Legal',
      links: [
        { label: language === 'bg' ? 'Условия за ползване' : 'Terms of Service', href: '/terms' },
        { label: language === 'bg' ? 'Политика за поверителност' : 'Privacy Policy', href: '/privacy' },
      ],
    },
  };

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <span className="text-lg font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">SportCoach</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {language === 'bg'
                ? 'Платформата за спортни треньори в България.'
                : "Bulgaria's sports coaching marketplace."}
            </p>
            <div className="mt-6 flex gap-3">
              <a href="#" className="rounded-lg bg-secondary p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="rounded-lg bg-secondary p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="rounded-lg bg-secondary p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="rounded-lg bg-secondary p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 font-semibold text-foreground">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} SportCoach. {language === 'bg' ? 'Всички права запазени.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
