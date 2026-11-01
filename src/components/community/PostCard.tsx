import { Heart, MessageCircle, Bookmark, BadgeCheck, Zap } from 'lucide-react';
import { type CommunityPost } from '@/lib/communityData';
import { lift } from '@/lib/ui';

export function PostCard({ post }: { post: CommunityPost }) {
  if (post.type === 'activity') {
    return (
      <div className="flex gap-4 bg-background-secondary p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary text-primary-foreground">
          <Zap className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span className="font-display text-base font-extrabold uppercase text-foreground">Lokka</span>
            <span>·</span>
            <span>{post.timeAgo}</span>
          </div>
          <p className="text-lg font-semibold leading-tight">{post.title}</p>
          <p className="text-base text-foreground-muted">
            {post.body.split('→').map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>
                  {part}
                  <span className="ml-1 font-display text-base font-bold uppercase text-primary">→ {arr[i + 1].trim()}</span>
                </span>
              ) : null
            )}
          </p>
        </div>
      </div>
    );
  }

  const isTip = post.type === 'tip';

  return (
    <article className={`group relative flex flex-col gap-3 bg-background-secondary p-5 ${lift}`}>
      <header className="flex items-start gap-3">
        <img src={post.avatar} alt={post.author} className="h-11 w-11 rounded-full object-cover" loading="lazy" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base font-semibold text-foreground">{post.author}</span>
            {post.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
            {post.isPro && <span className="bg-foreground px-1.5 py-0.5 text-xs font-bold text-background">PRO</span>}
          </div>
          <p className="text-sm text-foreground-muted">{post.authorCity} · {post.timeAgo}</p>
        </div>
        <span className="bg-background px-2.5 py-1 text-sm font-semibold">{post.sport_tag}</span>
      </header>

      {isTip && <span className="w-fit bg-accent px-2.5 py-1 text-sm font-bold text-white">COACH TIP</span>}

      <h3 className="t-plain text-xl">{post.title}</h3>
      <p className="line-clamp-3 text-base text-foreground-muted">{post.body}</p>
      <button className="self-start font-display text-base font-bold uppercase text-primary hover:underline">Read more →</button>

      <footer className="flex items-center gap-5 pt-2 text-foreground-muted">
        <button className="flex items-center gap-1.5 text-sm transition-colors hover:text-foreground"><Heart className="h-4 w-4" /> {post.likes}</button>
        <button className="flex items-center gap-1.5 text-sm transition-colors hover:text-foreground"><MessageCircle className="h-4 w-4" /> {post.comments}</button>
        <button className="ml-auto text-sm transition-colors hover:text-foreground" aria-label="Save"><Bookmark className="h-4 w-4" /></button>
      </footer>
    </article>
  );
}
