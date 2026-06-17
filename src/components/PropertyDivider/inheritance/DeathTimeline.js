// src/components/PropertyDivider/inheritance/DeathTimeline.js

/**
 * Get chronological death timeline
 */
export const getDeathTimeline = (allPersons) => {
  return allPersons
    .filter(p => p.isDeceased && p.dod)
    .sort((a, b) => new Date(a.dod) - new Date(b.dod))
    .map(p => ({ person: p, date: p.dod }));
};

/**
 * Processes all deaths in chronological order
 * This is the core engine that determines the order of inheritance events
 */
export const processDeathsChronologically = (allPersons) => {
  // Get all deceased persons sorted by date of death (oldest first)
  const deceased = allPersons
    .filter(p => p.dod && p.isDeceased)
    .sort((a, b) => new Date(a.dod) - new Date(b.dod));
  
  return deceased.map((decedent, index) => ({
    decedent,
    date: decedent.dod,
    order: index + 1,
    totalEvents: deceased.length
  }));
};

/**
 * Check if Person A died before Person B
 */
export const diedBefore = (personA, personB) => {
  if (!personA?.dod || !personB?.dod) return false;
  return new Date(personA.dod) < new Date(personB.dod);
};

/**
 * Check if Person A died after Person B
 */
export const diedAfter = (personA, personB) => {
  if (!personA?.dod || !personB?.dod) return false;
  return new Date(personA.dod) > new Date(personB.dod);
};