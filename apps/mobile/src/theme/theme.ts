// Design tokens. Previously just six colors and three spacing steps, which
// meant every screen invented its own button/title/spacing styles ad hoc —
// three near-duplicate "primary button" implementations, a danger red
// hardcoded independently in three files, magic numbers (paddingVertical: 4,
// marginTop: -38) wherever the spacing scale didn't reach far enough. This
// is the actual fix: a real scale, and shared components
// (components/Button.tsx, Card.tsx, Typography.tsx) built on top of it.
//
// Dark-only, deliberately not addressed here: this app's primary use case
// (PRD 2.5) is outdoors at a driving range, often in bright daylight, where
// a near-black UI can be genuinely harder to read than a light one. That's
// a real open question, not an oversight — worth its own deliberate pass
// (a light palette + following the system appearance setting) rather than
// folding into this token expansion.
export const colors = {
  background: '#0B0F14',
  surface: '#141A21',
  surfaceRaised: '#1B222B',
  primary: '#3DDC84',
  danger: '#D14343',
  text: '#F5F7FA',
  textMuted: '#9AA5B1',
  border: '#232B34',
  overlay: 'rgba(11, 15, 20, 0.6)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

// Named text roles, not raw fontSize/fontWeight pairs scattered per screen.
// Color is baked in for the common case (each role has always been paired
// with the same color everywhere it's used); callers needing a different
// color (e.g. danger-colored body text) merge in an override via a style
// array, same as any other RN style.
export const typography = {
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
  bodyStrong: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary,
  },
} as const;
