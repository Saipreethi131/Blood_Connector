const ALL_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Who can donate TO a given blood type (key = recipient)
export const COMPATIBLE_DONORS = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'],
};

// Can donorGroup donate to someone who needs neededGroup?
export const canDonate = (donorGroup, neededGroup) =>
  COMPATIBLE_DONORS[neededGroup]?.includes(donorGroup) ?? false;

// All donor blood types that are compatible with neededGroup (key = recipient)
export const getCompatibleDonors = (neededGroup) =>
  COMPATIBLE_DONORS[neededGroup] ?? [neededGroup];

// All request blood types a given donor can donate to (inverse lookup)
export const getDonatableTo = (donorGroup) =>
  ALL_GROUPS.filter((g) => canDonate(donorGroup, g));
