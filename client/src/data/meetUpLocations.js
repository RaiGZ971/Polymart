export const meetUpLocations = [
  { label: 'Lagoon', value: 'Lagoon' },
  { label: 'West Wing', value: 'West Wing' },
  { label: 'Dome', value: 'Dome' },
  { label: 'East Wing', value: 'East Wing' },
  { label: 'South Wing', value: 'South Wing' },
  { label: 'Linear Park', value: 'Linear Park' },
  { label: 'Charlie Building', value: 'Charlie Building' },
  { label: 'Grandstand', value: 'Grandstand' },
  { label: 'Tennis Court Side', value: 'Tennis Court Side' },
  { label: 'Souvenir Shop', value: 'Souvenir Shop' },
  { label: 'Gate Exit', value: 'Gate Exit' },
  { label: 'Gate Entrance', value: 'Gate Entrance' },
];

// For create a listing (no "All" option)
export const meetUpLocationsCreate = meetUpLocations;

// For categorical filtering (with "All" option)
export const meetUpLocationsFilter = [
  { value: 'all', label: 'All' },
  ...meetUpLocationsCreate
];

export default meetUpLocations;