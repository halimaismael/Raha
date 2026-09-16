// Palette inspirée de la Grande Comore : océan Indien, volcan Karthala,
// fleurs d'ylang-ylang et lagons turquoise.
export const colors = {
  ocean: '#0B4F4A',        // vert-bleu profond, couleur principale (marque)
  oceanDark: '#063431',
  lagoon: '#17B6A7',        // turquoise lagon, accent secondaire / succès
  coral: '#F0784B',         // corail-coucher de soleil, accent CTA
  ylang: '#F2B705',         // jaune ylang-ylang, alertes / notes
  gold: '#C9A227',          // or/laiton, accent premium (bannières, CTA services)
  onyx: '#14171C',          // noir profond, cartes "service premium"
  lavender: '#E8E3F5',      // lavande pâle, carte "Noces"
  sage: '#E4EEDD',          // vert sauge pâle, carte "Déménagement"
  cream: '#F3E9D2',         // crème, carte "Élégance"
  sand: '#FBF6EC',          // fond clair, sable
  sandDeep: '#F0E8D6',
  charcoal: '#1B2A2A',      // texte principal (basalte volcanique)
  slate: '#5B6B6A',         // texte secondaire
  line: '#E1D9C8',          // bordures
  white: '#FFFFFF',
  danger: '#D64545',
  success: '#1E9E6F',
};

export const radius = { sm: 8, md: 14, lg: 22, xl: 30, pill: 999 };

export const spacing = (n: number) => n * 4;

export const typography = {
  display: { fontSize: 28, fontWeight: '800' as const, color: colors.charcoal, letterSpacing: -0.5 },
  h1: { fontSize: 22, fontWeight: '700' as const, color: colors.charcoal },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.charcoal },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.charcoal },
  bodyMuted: { fontSize: 14, fontWeight: '400' as const, color: colors.slate },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.slate },
  button: { fontSize: 15, fontWeight: '700' as const, color: colors.white },
};
