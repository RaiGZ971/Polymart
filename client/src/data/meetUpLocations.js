const meetUpLocations = [
  { value: 'lagoon', label: 'Lagoon' },
  { value: 'westwing', label: 'West Wing' },
  { value: 'dome', label: 'Dome' },
  { value: 'eastwing', label: 'East Wing' },
  { value: 'southwing', label: 'South Wing' },
  { value: 'linearpark', label: 'Linear Park' },
  { value: 'charliebuilding', label: 'Charlie Building' },
  { value: 'grandstand', label: 'Grandstand' },
  { value: 'tenniscourtside', label: 'Tennis Court Side' },
  { value: 'souvenirshop', label: 'Souvenir Shop' },
  { value: 'gateexit', label: 'Gate Exit' },
  { value: 'gateentrance', label: 'Gate Entrance' },
];

// For create a listing (no "All" option)
export const meetUpLocationsCreate = meetUpLocations;

// For categorical filtering (with "All" option)
export const meetUpLocationsFilter = [
  { value: 'all', label: 'All' },
  ...meetUpLocationsCreate
];

export default meetUpLocations;