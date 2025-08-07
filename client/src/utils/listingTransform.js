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
 * Parse time string like '6am', '12pm' to a numeric value for comparison
 * @param {string} timeStr - Time string like '6am' or '12pm'
 * @returns {number} Numeric representation (0-23 for hours)
 */
const parseTimeValue = (timeStr) => {
  const match = timeStr.match(/^(\d{1,2})(am|pm)$/i);
  if (!match) {
    return 0;
  }
  
  let hours = parseInt(match[1], 10);
  const period = match[2].toLowerCase();
  
  if (period === 'am') {
    if (hours === 12) {
      hours = 0; // 12am = 00:00
    }
  } else { // pm
    if (hours !== 12) {
      hours += 12; // 1pm = 13:00, but 12pm = 12:00
    }
  }
  
  return hours;
};

/**
 * Parse time slot string (e.g., '6am-7am', '12pm-1pm') into start and end datetime objects
 * @param {string} timeSlotValue - Time slot string like '6am-7am'
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {Object|null} Object with start_time and end_time, or null if parsing fails
 */
const parseTimeSlot = (timeSlotValue, date) => {
  try {
    // Split the time slot value (e.g., '6am-7am' -> ['6am', '7am'])
    const [startTimeStr, endTimeStr] = timeSlotValue.split('-');
    
    if (!startTimeStr || !endTimeStr) {
      console.warn(`Invalid time slot format: ${timeSlotValue}`);
      return null;
    }
    
    // Convert time strings to 24-hour format
    const startTime24 = convertTo24Hour(startTimeStr.trim());
    const endTime24 = convertTo24Hour(endTimeStr.trim());
    
    if (!startTime24 || !endTime24) {
      console.warn(`Failed to parse time slot: ${timeSlotValue}`);
      return null;
    }
    
    // Create full datetime objects
    const startDateTime = new Date(`${date}T${startTime24}:00`);
    const endDateTime = new Date(`${date}T${endTime24}:00`);
    
    return {
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString()
    };
  } catch (error) {
    console.error(`Error parsing time slot ${timeSlotValue}:`, error);
    return null;
  }
};

/**
 * Convert time string like '6am', '12pm', '1pm' to 24-hour format like '06:00', '12:00', '13:00'
 * @param {string} timeStr - Time string like '6am' or '12pm'
 * @returns {string|null} Time in 24-hour format like '06:00' or null if parsing fails
 */
const convertTo24Hour = (timeStr) => {
  try {
    // Extract number and am/pm
    const match = timeStr.match(/^(\d{1,2})(am|pm)$/i);
    if (!match) {
      return null;
    }
    
    let hours = parseInt(match[1], 10);
    const period = match[2].toLowerCase();
    
    // Convert to 24-hour format
    if (period === 'am') {
      if (hours === 12) {
        hours = 0; // 12am = 00:00
      }
    } else { // pm
      if (hours !== 12) {
        hours += 12; // 1pm = 13:00, but 12pm = 12:00
      }
    }
    
    // Return formatted time
    return `${hours.toString().padStart(2, '0')}:00`;
  } catch (error) {
    console.error(`Error converting time ${timeStr}:`, error);
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
  
  // Map frontend transaction method values to backend values
  const transactionMethodMap = {
    'meetup': 'meet_up',
    'online': 'online'
  };
  
  const mappedTransactionMethods = listingData.transactionMethods?.map(method => 
    transactionMethodMap[method] || method
  ) || [];
  
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
    transaction_methods: mappedTransactionMethods,
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
  const hasMeetup = listingData.transactionMethods?.includes('meetup');
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
