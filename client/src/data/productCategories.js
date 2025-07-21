const productCategories = [
  { label: 'Academic Essentials', value: 'academic' },
  { label: 'Creative Works', value: 'creative' },
  { label: 'Services', value: 'services' },
  { label: 'Tech & Gadgets', value: 'technology' },
  { label: 'Fashion', value: 'fashion' },
  { label: 'Anik-Anik', value: 'anik' },
  { label: 'Other', value: 'other' }
];

// Categories for filtering/browsing (includes "All Categories")
export const browsableCategories = [
  { label: 'All Categories', value: 'all' },
  ...productCategories
];

export default productCategories;