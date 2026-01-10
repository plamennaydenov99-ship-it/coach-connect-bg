import { Star, Quote } from 'lucide-react';
import { reviews, coaches } from '@/lib/data';
import { useLanguage } from '@/contexts/LanguageContext';

export function Testimonials() {
  const { language } = useLanguage();
  const displayedReviews = reviews.slice(0, 3);

  const getCoachName = (coachId: string) => {
    const coach = coaches.find(c => c.id === coachId);
    return coach?.displayName || 'Unknown';
  };

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold">
            {language === 'bg' ? 'Какво казват клиентите' : 'What Clients Say'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'bg' 
              ? 'Истински отзиви от доволни клиенти' 
              : 'Real reviews from satisfied clients'}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {displayedReviews.map((review) => (
            <article
              key={review.id}
              className="relative rounded-2xl bg-card p-6 shadow-card"
            >
              {/* Quote icon */}
              <Quote className="absolute right-6 top-6 h-8 w-8 text-muted/30" />

              {/* Rating */}
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'fill-warning text-warning'
                        : 'text-muted'
                    }`}
                  />
                ))}
              </div>

              {/* Review text */}
              <p className="mb-6 text-foreground">"{review.text}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={review.authorAvatar}
                  alt={review.authorName}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-foreground">
                    {review.authorName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'bg' ? 'за' : 'about'} {getCoachName(review.coachId)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
