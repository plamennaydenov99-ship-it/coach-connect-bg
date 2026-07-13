import { Heart, MessageCircle, Bookmark, BadgeCheck, Zap } from 'lucide-react';
import { type CommunityPost } from '@/lib/communityData';

export function PostCard({ post }: { post: CommunityPost }) {
  if (post.type === 'activity') {
    return (
      <div className="flex gap-3 bg-background border border-border p-4 rounded-sm">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-navy/10 border border-copper/30 rounded-sm">
          <Zap className="h-4 w-4 text-gold" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-foreground-muted">
            <span className="font-display uppercase tracking-[0.12em] text-foreground">Atleta</span>
            <span>·</span>
            <span>{post.timeAgo}</span>
          </div>
          <p className="font-display text-[15px] text-foreground italic">{post.title}</p>
          <p className="text-[13px] text-foreground-muted italic">
            {post.body.split('→').map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>
                  {part}
                  <span className="text-gold not-italic font-display uppercase tracking-[0.1em] text-[12px] ml-1">→ {arr[i + 1].trim()}</span>
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
    <article
      className={`group relative flex flex-col gap-3 bg-card border border-border hover:border-gold transition-colors p-4 rounded-sm ${
        isTip ? 'border-l-2 border-l-copper' : ''
      }`}
    >
      <header className="flex items-start gap-3">
        <img src={post.avatar} alt={post.author} className="h-10 w-10 rounded-full object-cover border border-border" loading="lazy" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-display text-[14px] text-foreground tracking-wide">{post.author}</span>
            {post.verified && <BadgeCheck className="h-3.5 w-3.5 text-gold" />}
            {post.isPro && (
              <span className="px-1.5 py-0.5 text-[10px] font-display uppercase tracking-[0.12em] bg-background-tertiary text-gold rounded-sm">
                PRO
              </span>
            )}
          </div>
          <p className="text-[12px] text-foreground-muted">
            {post.authorCity} · {post.timeAgo}
          </p>
        </div>
        <span className="px-2 py-0.5 text-[11px] font-display uppercase tracking-[0.12em] bg-[hsl(var(--coach-accent))] text-[hsl(var(--coach-accent-glow))] rounded-sm">
          {post.sport_tag}
        </span>
      </header>

      {isTip && (
        <span className="font-display uppercase tracking-[0.15em] text-[11px] text-gold">
          COACH TIP
        </span>
      )}

      <h3 className="font-display text-[16px] text-foreground leading-snug normal-case">{post.title}</h3>
      <p className="text-[14px] text-foreground-muted font-body line-clamp-3">{post.body}</p>
      <button className="self-start text-[12px] text-gold font-display uppercase tracking-[0.12em] hover:underline">
        Read more →
      </button>

      <footer className="flex items-center gap-5 pt-2 border-t border-border text-foreground-muted">
        <button className="flex items-center gap-1.5 text-[13px] hover:text-foreground transition-colors">
          <Heart className="h-4 w-4" /> {post.likes}
        </button>
        <button className="flex items-center gap-1.5 text-[13px] hover:text-foreground transition-colors">
          <MessageCircle className="h-4 w-4" /> {post.comments}
        </button>
        <button className="ml-auto text-[13px] hover:text-gold transition-colors">
          <Bookmark className="h-4 w-4" />
        </button>
      </footer>
    </article>
  );
}
