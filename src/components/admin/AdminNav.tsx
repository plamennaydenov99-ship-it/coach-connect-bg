import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'People' },
  { to: '/admin/review', label: 'Applications' },
  { to: '/admin/trending', label: 'Trending & boosts' },
];

/** The tab strip every admin page starts with, so you can always jump between them. */
export function AdminNav() {
  return (
    <nav aria-label="Admin" className="mb-10 flex gap-1 overflow-x-auto pb-1">
      {TABS.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `inline-flex h-10 items-center whitespace-nowrap px-4 text-sm font-medium transition-colors ${
              isActive ? 'bg-foreground text-background' : 'bg-background-secondary text-foreground hover:bg-background-tertiary'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
