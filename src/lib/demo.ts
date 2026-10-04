/** Testing mode: one-click role switcher replaces sign-in. Auth code stays, hidden behind this flag. */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'on';

export type DemoRole = 'coach' | 'club' | 'athlete' | 'admin';
export const DEMO_ROLES: DemoRole[] = ['coach', 'club', 'athlete', 'admin'];
export const DEMO_HOME: Record<DemoRole, string> = {
  coach: '/coach',
  club: '/club',
  athlete: '/discover',
  admin: '/admin/trending',
};
