import { useParams, Link } from 'react-router-dom';
import { 
  Star, CheckCircle2, MapPin, Globe2, Clock, Users, 
  MessageSquare, Share2, ChevronLeft, Calendar
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { coaches, offers, reviews } from '@/lib/data';

const CoachProfile = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();

  const coach = coaches.find((c) => c.id === id);
  const coachOffers = offers.filter((o) => o.coachId === id);
  const coachReviews = reviews.filter((r) => r.coachId === id);

  if (!coach) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4">{language === 'bg' ? 'Треньорът не е намерен' : 'Coach not found'}</h1>
            <Link to="/coaches">
              <Button>{language === 'bg' ? 'Назад към търсене' : 'Back to search'}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Cover image */}
        <div className="relative h-64 md:h-80">
          <img
            src={coach.coverPhotos[0] || '/placeholder.svg'}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="container relative h-full">
            <Link to="/coaches" className="absolute left-4 top-4">
              <Button variant="secondary" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                {language === 'bg' ? 'Назад' : 'Back'}
              </Button>
            </Link>
          </div>
        </div>

        <div className="container relative -mt-20 pb-16">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main content */}
            <div className="lg:col-span-2">
              {/* Profile header */}
              <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                <img
                  src={coach.avatarUrl}
                  alt={coach.displayName}
                  className="h-32 w-32 rounded-2xl border-4 border-background object-cover shadow-xl"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1>{coach.displayName}</h1>
                    {coach.verified && (
                      <Badge className="badge-verified">
                        <CheckCircle2 className="h-3 w-3" />
                        {t.coach.verified}
                      </Badge>
                    )}
                    {coach.type === 'company' && (
                      <Badge variant="secondary">Club</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {t.cities[coach.city as keyof typeof t.cities]}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-semibold text-foreground">{coach.ratingAvg.toFixed(1)}</span>
                      <span>({coach.ratingCount} {t.coach.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {coach.experienceYears} {t.coach.years}
                    </div>
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div className="mb-6 flex flex-wrap gap-2">
                {coach.specializations.map((spec) => (
                  <Badge key={spec} variant="secondary" className="badge-sport">
                    {t.sports[spec as keyof typeof t.sports] || spec}
                  </Badge>
                ))}
              </div>

              {/* Languages */}
              <div className="mb-8 flex items-center gap-2 text-muted-foreground">
                <Globe2 className="h-4 w-4" />
                <span>{t.coach.speaks}:</span>
                {coach.languages.map((lang, i) => (
                  <span key={lang}>
                    {lang === 'bg' ? 'Български' : lang === 'en' ? 'English' : lang}
                    {i < coach.languages.length - 1 && ','}
                  </span>
                ))}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start border-b bg-transparent p-0">
                  <TabsTrigger
                    value="about"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    {t.coach.about}
                  </TabsTrigger>
                  <TabsTrigger
                    value="offers"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    {t.coach.offers} ({coachOffers.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    {t.coach.reviews} ({coachReviews.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="pt-6">
                  <p className="whitespace-pre-line text-foreground leading-relaxed">
                    {coach.bio}
                  </p>
                </TabsContent>

                <TabsContent value="offers" className="pt-6">
                  <div className="space-y-4">
                    {coachOffers.map((offer) => (
                      <div
                        key={offer.id}
                        className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <h4>{offer.title}</h4>
                            <Badge variant={offer.type === '1v1' ? 'default' : 'secondary'}>
                              {offer.type === '1v1' ? t.filters.oneOnOne : t.filters.group}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{offer.description}</p>
                          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {offer.durationMin} {t.booking.minutes}
                            </span>
                            {offer.capacity && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {language === 'bg' ? 'до' : 'up to'} {offer.capacity}
                              </span>
                            )}
                            <Badge variant="outline">
                              {offer.mode === 'in-person' ? t.filters.inPerson : 
                               offer.mode === 'online' ? t.filters.online : 
                               `${t.filters.inPerson} / ${t.filters.online}`}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="price-tag text-xl">
                              {offer.priceBGN} <span className="text-sm">{t.common.bgn}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">{t.coach.perSession}</div>
                          </div>
                          <Button>{t.coach.bookNow}</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="pt-6">
                  <div className="space-y-6">
                    {coachReviews.map((review) => (
                      <div key={review.id} className="border-b border-border pb-6 last:border-0">
                        <div className="mb-3 flex items-center gap-3">
                          <img
                            src={review.authorAvatar}
                            alt={review.authorName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-medium">{review.authorName}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < review.rating
                                        ? 'fill-warning text-warning'
                                        : 'text-muted'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString(
                                  language === 'bg' ? 'bg-BG' : 'en-US'
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-foreground">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Quick booking card */}
                <div className="rounded-2xl bg-card p-6 shadow-card">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">{t.coach.fromPrice}</span>
                      <div className="price-tag text-2xl">
                        {coach.priceFrom} <span className="text-base">{t.common.bgn}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full gap-2" size="lg">
                    <Calendar className="h-4 w-4" />
                    {t.coach.bookNow}
                  </Button>
                  <Button variant="outline" className="mt-3 w-full gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {language === 'bg' ? 'Задай въпрос' : 'Ask a question'}
                  </Button>
                </div>

                {/* Location */}
                <div className="rounded-2xl bg-card p-6 shadow-card">
                  <h4 className="mb-3">{t.coach.location}</h4>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {t.cities[coach.city as keyof typeof t.cities]}, Bulgaria
                  </div>
                  <div className="mt-4 h-40 rounded-xl bg-secondary">
                    {/* Map placeholder */}
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <MapPin className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CoachProfile;
