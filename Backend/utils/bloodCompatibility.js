// Who can donate TO a given blood type
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

// All donor blood types that are compatible with neededGroup
export const getCompatibleDonors = (neededGroup) =>
  COMPATIBLE_DONORS[neededGroup] ?? [neededGroup];
