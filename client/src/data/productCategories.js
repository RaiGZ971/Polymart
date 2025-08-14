const productCategories = [
  { label: 'Academic Essentials', value: 'Academic_Essentials' },
  { label: 'Creative Works', value: 'Creative_Works' },
  { label: 'Services', value: 'Services' },
  { label: 'Tech & Gadgets', value: 'Tech_Gadgets' },
  { label: 'Fashion', value: 'Fashion' },
  { label: 'Anik-Anik', value: 'Anik-Anik' },
  { label: 'Other', value: 'Other' }
];

// Categories for filtering/browsing (includes "All Categories")
export const browsableCategories = [
  { label: 'All Categories', value: 'all' },
  ...productCategories
];

export default productCategories;