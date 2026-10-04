import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { LanguageOverride, useLanguage } from '@/context/LanguageContext';
import { clubLabelOverrides } from '@/lib/staffLabels';

export type StaffRole = 'coach' | 'club';

const StaffRoleContext = createContext<StaffRole>('coach');

export const staffConfig = (role: StaffRole) => ({
  role,
  base: role === 'club' ? '/club' : '/coach',
  people: role === 'club' ? 'members' : 'clients',
});

/** Current staff portal role; defaults to coach outside a portal. */
export const useStaffRole = () => useContext(StaffRoleContext);

export function useStaffPaths() {
  const cfg = staffConfig(useStaffRole());
  return { ...cfg, peoplePath: `${cfg.base}/${cfg.people}` };
}

/** Provides the role and swaps client wording for member wording in club portals. */
export function StaffRoleProvider({ role, children }: { role: StaffRole; children: ReactNode }) {
  const { lang } = useLanguage();
  const overrides = useMemo(() => (role === 'club' ? clubLabelOverrides[lang] : {}), [role, lang]);
  return (
    <StaffRoleContext.Provider value={role}>
      <LanguageOverride overrides={overrides}>{children}</LanguageOverride>
    </StaffRoleContext.Provider>
  );
}
