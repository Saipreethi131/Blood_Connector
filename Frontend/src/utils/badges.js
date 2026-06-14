export const BADGE_DEFINITIONS = [
  { id: 'first_drop',     label: 'First Drop',      icon: '🩸', threshold: 1,  description: 'Made your first donation' },
  { id: 'life_giver',     label: 'Life Giver',       icon: '💉', threshold: 5,  description: 'Completed 5 donations' },
  { id: 'blood_hero',     label: 'Blood Hero',        icon: '🦸', threshold: 10, description: 'Completed 10 donations' },
  { id: 'guardian_angel', label: 'Guardian Angel',   icon: '😇', threshold: 25, description: 'Completed 25 donations' },
  { id: 'legend',         label: 'Legend',            icon: '🏆', threshold: 50, description: 'Completed 50 donations' },
];

export const computeBadges = (totalDonations = 0) =>
  BADGE_DEFINITIONS.filter((b) => totalDonations >= b.threshold);

export const nextBadge = (totalDonations = 0) =>
  BADGE_DEFINITIONS.find((b) => totalDonations < b.threshold) || null;
