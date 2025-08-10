/**
 * Simplify consecutive time slots on the same date into merged ranges
 * @param {Array} schedules - Array of schedule objects with date and times
 * @returns {Array} Simplified schedules with merged consecutive time slots
 */
const simplifyTimeSlots = (schedules) => {
  const simplifiedSchedules = [];
  
  schedules.forEach(schedule => {
    if (!schedule.date || !schedule.times || schedule.times.length === 0) {
      return;
    }
    
    // Sort time slots by start time to ensure proper ordering
    const sortedTimes = [...schedule.times].sort((a, b) => {
      const timeA = parseTimeValue(a.split('-')[0]);
      const timeB = parseTimeValue(b.split('-')[0]);
      return timeA - timeB;
    });
    
    const mergedTimes = [];
    let currentRange = null;
    
    sortedTimes.forEach(timeSlot => {
      const [startStr, endStr] = timeSlot.split('-');
      const startTime = parseTimeValue(startStr);
      const endTime = parseTimeValue(endStr);
      
      if (!currentRange) {
        // Start new range
        currentRange = {
          start: startTime,
          end: endTime,
          startStr: startStr,
          endStr: endStr
        };
      } else if (currentRange.end === startTime) {
        // Consecutive time slot - extend the range
        currentRange.end = endTime;
        currentRange.endStr = endStr;
      } else {
        // Gap found - save current range and start new one
        mergedTimes.push(`${currentRange.startStr}-${currentRange.endStr}`);
        currentRange = {
          start: startTime,
          end: endTime,
          startStr: startStr,
          endStr: endStr
        };
      }
    });
    
    // Don't forget to add the last range
    if (currentRange) {
      mergedTimes.push(`${currentRange.startStr}-${currentRange.endStr}`);
    }
    
    if (mergedTimes.length > 0) {
      simplifiedSchedules.push({
        date: schedule.date,
        times: mergedTimes
      });
    }
  });
  
  return simplifiedSchedules;
};

/**
 * Parse time string like '06:00', '14:30' to a numeric value for comparison
 * @param {string} timeStr - Time string like '06:00' or '14:30'
 * @returns {number} Numeric representation (minutes since midnight)
 */
const parseTimeValue = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
  return hours * 60 + (minutes || 0);
};

/**
 * Parse time slot string (e.g., '06:00-07:00', '14:30-15:30') into start and end datetime objects
 * @param {string} timeSlotValue - Time slot string like '06:00-07:00'
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {Object|null} Object with start_time and end_time, or null if parsing fails
 */
const parseTimeSlot = (timeSlotValue, date) => {
  try {
    // Split the time slot value (e.g., '06:00-07:00' -> ['06:00', '07:00'])
    const [startTimeStr, endTimeStr] = timeSlotValue.split('-');
    
    if (!startTimeStr || !endTimeStr) {
      console.warn(`Invalid time slot format: ${timeSlotValue}`);
      return null;
    }
    
    const startTime = startTimeStr.trim();
    const endTime = endTimeStr.trim();
    
    // Handle midnight crossing (e.g., "23:00-00:00")
    let startDate = date;
    let endDate = date;
    
    // If end time is "00:00" and start time is after noon, end time is next day
    if (endTime === '00:00' && startTime !== '00:00') {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      endDate = nextDay.toISOString().split('T')[0]; // Get YYYY-MM-DD format
    }
    
    // Create ISO strings directly to avoid timezone issues
    const startDateTime = `${startDate}T${startTime}:00.000Z`;
    const endDateTime = `${endDate}T${endTime}:00.000Z`;
    
    // Validate the datetime strings
    const startDateObj = new Date(startDateTime);
    const endDateObj = new Date(endDateTime);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      console.warn(`Failed to parse time slot: ${timeSlotValue}`);
      return null;
    }
    
    if (startDateObj >= endDateObj) {
      console.warn(`Invalid time slot - start time must be before end time: ${timeSlotValue}`);
      return null;
    }
    
    return {
      start_time: startDateTime,
      end_time: endDateTime
    };
  } catch (error) {
    console.error(`Error parsing time slot ${timeSlotValue}:`, error);
    return null;
  }
};

/**
 * Transform frontend listing data to backend API format
 * @param {Object} listingData - Frontend listing form data
 * @returns {Object} Transformed data for backend API
 */
export const transformListingDataForAPI = (listingData) => {
  // Transform price data
  let price_min = null;
  let price_max = null;
  
  if (listingData.hasPriceRange && listingData.priceRange.min && listingData.priceRange.max) {
    price_min = parseFloat(listingData.priceRange.min);
    price_max = parseFloat(listingData.priceRange.max);
  } else if (listingData.price) {
    price_min = parseFloat(listingData.price);
    price_max = parseFloat(listingData.price); // Same value for fixed price
  }
  
  // Transform meetup time slots
  let meetup_time_slots = null;
  if (listingData.availableSchedules && listingData.availableSchedules.length > 0) {
    // First simplify consecutive time slots
    const simplifiedSchedules = simplifyTimeSlots(listingData.availableSchedules);
    
    if (simplifiedSchedules.length > 0) {
      meetup_time_slots = [];
      
      simplifiedSchedules.forEach(schedule => {
        if (schedule.date && schedule.times && schedule.times.length > 0) {
          schedule.times.forEach(timeSlotValue => {
            // Parse time slot string like '6am-7am' or '6am-8am' (now simplified)
            const timeSlot = parseTimeSlot(timeSlotValue, schedule.date);
            if (timeSlot) {
              meetup_time_slots.push(timeSlot);
            }
          });
        }
      });
      
      if (meetup_time_slots.length === 0) {
        meetup_time_slots = null;
      }
    }
  }
  
  // Transform the data to match backend schema
  const transformedData = {
    name: listingData.productTitle,
    description: listingData.productDescription || null,
    category: listingData.productCategory,
    tags: listingData.productTags || null,
    price_min,
    price_max,
    total_stock: listingData.isSingleItem ? 1 : parseInt(listingData.stock) || 1,
    seller_meetup_locations: listingData.meetupLocations && listingData.meetupLocations.length > 0 
      ? listingData.meetupLocations 
      : null,
    meetup_time_slots,
    transaction_methods: listingData.transactionMethods || [],
    payment_methods: listingData.paymentMethods || []
  };
  
  return transformedData;
};

/**
 * Validate that required fields are present
 * @param {Object} listingData - Frontend listing form data
 * @returns {Object} Validation result with isValid boolean and errors object
 */
export const validateListingData = (listingData) => {
  const errors = {};
  
  // Required fields
  if (!listingData.productTitle?.trim()) {
    errors.productTitle = "Product title is required";
  }
  
  if (!listingData.productDescription?.trim()) {
    errors.productDescription = "Product description is required";
  }
  
  if (!listingData.productCategory) {
    errors.productCategory = "Category is required";
  }
  
  if (!listingData.productImages || listingData.productImages.length === 0) {
    errors.productImages = "At least one image is required";
  }
  
  if (listingData.productImages && listingData.productImages.length > 5) {
    errors.productImages = "Maximum 5 images allowed";
  }
  
  // Price validation
  if (!listingData.hasPriceRange) {
    if (!listingData.price || parseFloat(listingData.price) <= 0) {
      errors.price = "Valid price is required";
    }
  } else {
    if (!listingData.priceRange.min || parseFloat(listingData.priceRange.min) <= 0) {
      errors["priceRange.min"] = "Valid minimum price is required";
    }
    if (!listingData.priceRange.max || parseFloat(listingData.priceRange.max) <= 0) {
      errors["priceRange.max"] = "Valid maximum price is required";
    }
    if (listingData.priceRange.min && listingData.priceRange.max && 
        parseFloat(listingData.priceRange.min) >= parseFloat(listingData.priceRange.max)) {
      errors["priceRange.max"] = "Maximum price must be greater than minimum price";
    }
  }
  
  // Stock validation (if not single item)
  if (!listingData.isSingleItem) {
    if (!listingData.stock || parseInt(listingData.stock) <= 0) {
      errors.stock = "Valid stock quantity is required";
    }
  }
  
  // Transaction methods validation
  if (!listingData.transactionMethods || listingData.transactionMethods.length === 0) {
    errors.transactionMethods = "At least one transaction method is required";
  }
  
  // Payment methods validation
  if (!listingData.paymentMethods || listingData.paymentMethods.length === 0) {
    errors.paymentMethods = "At least one payment method is required";
  }
  
  // Meet-up specific validations
  const hasMeetup = listingData.transactionMethods?.includes('Meet-up');
  if (hasMeetup) {
    if (!listingData.meetupLocations || listingData.meetupLocations.length === 0) {
      errors.meetupLocations = "At least one meetup location is required for meet-up transactions";
    }
    
    if (!listingData.availableSchedules || listingData.availableSchedules.length === 0) {
      errors.availableSchedules = "At least one available schedule is required for meet-up transactions";
    } else {
      // Check if there are actually valid time slots after simplification
      const simplifiedSchedules = simplifyTimeSlots(listingData.availableSchedules);
      if (simplifiedSchedules.length === 0) {
        errors.availableSchedules = "At least one valid time slot is required for meet-up transactions";
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Transform listing data for API update (excludes images and only includes changed fields)
 * @param {Object} listingData - The listing form data
 * @returns {Object} Transformed data ready for PATCH API call
 */
export const transformListingDataForUpdate = (listingData) => {
  const updateData = {};

  // Basic fields
  if (listingData.productName?.trim()) {
    updateData.name = listingData.productName.trim();
  }
  
  if (listingData.productDescription?.trim()) {
    updateData.description = listingData.productDescription.trim();
  }
  
  if (listingData.category) {
    updateData.category = listingData.category;
  }
  
  if (listingData.tags?.trim()) {
    updateData.tags = listingData.tags.trim();
  }

  // Handle pricing
  if (listingData.hasPriceRange && listingData.priceRange) {
    const minPrice = parseFloat(listingData.priceRange.min);
    const maxPrice = parseFloat(listingData.priceRange.max);
    
    if (!isNaN(minPrice)) {
      updateData.price_min = minPrice;
    }
    if (!isNaN(maxPrice)) {
      updateData.price_max = maxPrice;
    }
  } else if (listingData.productPrice) {
    const price = parseFloat(listingData.productPrice);
    if (!isNaN(price)) {
      updateData.price_min = price;
      updateData.price_max = price;
    }
  }

  // Stock
  if (listingData.stock !== undefined && listingData.stock !== '') {
    const stock = parseInt(listingData.stock);
    if (!isNaN(stock) && stock >= 0) {
      updateData.total_stock = stock;
    }
  }

  // Meetup locations
  if (listingData.meetupLocations && Array.isArray(listingData.meetupLocations)) {
    updateData.seller_meetup_locations = listingData.meetupLocations.filter(loc => loc.trim());
  }

  // Transform meetup time slots to API format
  if (listingData.meetupTimeSlots && Array.isArray(listingData.meetupTimeSlots)) {
    const timeSlots = [];
    
    listingData.meetupTimeSlots.forEach(schedule => {
      if (schedule.date && schedule.times && schedule.times.length > 0) {
        schedule.times.forEach(timeRange => {
          const [startTimeStr, endTimeStr] = timeRange.split('-');
          
          if (startTimeStr && endTimeStr) {
            const startTime = startTimeStr.trim();
            const endTime = endTimeStr.trim();
            
            // Handle midnight crossing
            let startDate = schedule.date;
            let endDate = schedule.date;
            
            // If end time is "00:00" and start time is after noon, end time is next day
            if (endTime === '00:00' && startTime !== '00:00') {
              const nextDay = new Date(schedule.date);
              nextDay.setDate(nextDay.getDate() + 1);
              endDate = nextDay.toISOString().split('T')[0];
            }
            
            // Create ISO strings directly to avoid timezone issues
            const startDateTime = `${startDate}T${startTime}:00.000Z`;
            const endDateTime = `${endDate}T${endTime}:00.000Z`;
            
            // Validate the datetime strings
            const startDateObj = new Date(startDateTime);
            const endDateObj = new Date(endDateTime);
            
            if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime()) && startDateObj < endDateObj) {
              timeSlots.push({
                start_time: startDateTime,
                end_time: endDateTime
              });
            }
          }
        });
      }
    });
    
    updateData.meetup_time_slots = timeSlots;
  }

  // Transaction and payment methods
  if (listingData.transactionMethods && Array.isArray(listingData.transactionMethods)) {
    updateData.transaction_methods = listingData.transactionMethods;
  }
  
  if (listingData.paymentMethods && Array.isArray(listingData.paymentMethods)) {
    updateData.payment_methods = listingData.paymentMethods;
  }

  return updateData;
};
