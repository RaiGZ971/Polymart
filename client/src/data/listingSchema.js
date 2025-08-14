import meetUpLocations from "./meetUpLocations";
import transactionMethods from "./transactionMethods";
import paymentMethods from "./paymentMethods";
import productCategories from "./productCategories";
import timeSlots from "./timeSlots";

export const initialListingData = {
  // Product Details
  productImages: [], // max 5 images
  productTitle: "",
  productDescription: "",
  productCategory: "",
  productTags: "",

  // Pricing
  hasPrice: true, // boolean: true = fixed price, false = price range
  hasPriceRange: false,
  price: "",
  priceRange: {
    min: "",
    max: "",
  },

  // Stock
  isSingleItem: true, // boolean: true = selling one item, false = multiple
  stock: 1,

  // Transaction Details
  transactionMethods: [], // max 2 items: ['Online', 'Meet-up']
  paymentMethods: [], // multiple: ['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Remittance']
  meetupLocations: [], // array of selected locations: Lagoon, Grandstand, etc.
  availableSchedules: [], // array of date objects

  // Additional
  remark: "",
};

export const listingFieldConfig = {
  productTitle: {
    label: "Product Title",
    required: true,
    component: "textfield",
    maxLength: 100,
  },
  productDescription: {
    label: "Product Description",
    required: true,
    component: "textarea",
    maxLength: 500,
    rows: 4,
  },
  productCategory: {
    label: "Category",
    required: true,
    component: "dropdown",
    options: productCategories,
  },
  productTags: {
    label: "Tags (Optional)",
    required: false,
    component: "textfield",
  },
  hasPriceRange: {
    label: "Include price range",
    required: false,
    component: "checkbox",
  },
  price: {
    label: "Price",
    required: true,
    component: "textfield",
    type: "number",
    min: 1,
  },
  priceRange: {
    min: {
      label: "Minimum Price",
      required: true,
      component: "textfield",
      type: "number",
      min: 1,
    },
    max: {
      label: "Maximum Price",
      required: true,
      component: "textfield",
      type: "number",
      min: 1,
    },
  },
  isSingleItem: {
    label: "I'm selling a single-item product",
    required: false,
    component: "checkbox",
  },
  stock: {
    label: "Stock Quantity",
    required: true,
    component: "textfield",
    type: "number",
    min: 1,
  },
  transactionMethods: {
    label: "Transaction Methods",
    required: true,
    component: "toggle",
    maxSelections: 1,
    options: transactionMethods,
  },
  paymentMethods: {
    label: "Payment Methods",
    required: true,
    component: "toggle",
    maxSelections: 5,
    options: paymentMethods,
  },
  meetupLocations: {
    label: "Meet-up Locations",
    required: false,
    component: "checkbox",
    options: meetUpLocations,
  },
  availableSchedules: {
    label: "Available Schedules",
    required: false,
    component: "calendar",
    timeSlots: timeSlots,
  },
  remark: {
    label: "Remarks (Optional)",
    required: false,
    component: "textarea",
    maxLength: 200,
    rows: 3,
  },
};

export default initialListingData;
