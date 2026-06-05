// Utility helpers for formatting location names

/**
 * Return true if the given string is composed of uppercase letters (allowing spaces, hyphens and apostrophes).
 */
export function isAllUppercaseName(s: string | undefined): boolean {
  if (!s) return false;
  const cleaned = s.replace(/[^A-Z\s\-']/g, '');
  return cleaned.trim().length > 0 && cleaned === cleaned.toUpperCase();
}

/**
 * Convert a name into Title Case while preserving separators (spaces, hyphens, apostrophes).
 */
export function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s|\-|')/)
    .map(part => (/[-\s']/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

/**
 * Convert minutes into the most appropriate time unit (hours, days, weeks, months, or years).
 * Returns a formatted string with the converted time and appropriate unit.
 */
export function formatTimeFromMinutes(minutes: number): string {
  if (minutes < 0) return '0 min';
  
  // Less than 60 minutes - show minutes
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  
  // Less than 24 hours - show hours
  const hours = minutes / 60;
  if (hours < 24) {
    const roundedHours = Math.round(hours * 10) / 10; // Round to 1 decimal place
    return roundedHours % 1 === 0 ? `${roundedHours} hr` : `${roundedHours} hr`;
  }
  
  // Less than 7 days - show days
  const days = hours / 24;
  if (days < 7) {
    const roundedDays = Math.round(days * 10) / 10;
    return roundedDays % 1 === 0 ? `${roundedDays} day${roundedDays !== 1 ? 's' : ''}` : `${roundedDays} day${roundedDays !== 1 ? 's' : ''}`;
  }
  
  // Less than 4.33 weeks (approximately 1 month) - show weeks
  const weeks = days / 7;
  if (weeks < 4.33) {
    const roundedWeeks = Math.round(weeks * 10) / 10;
    return roundedWeeks % 1 === 0 ? `${roundedWeeks} week${roundedWeeks !== 1 ? 's' : ''}` : `${roundedWeeks} week${roundedWeeks !== 1 ? 's' : ''}`;
  }
  
  // Less than 12 months - show months
  const months = days / 30.44; // Average days in a month
  if (months < 12) {
    const roundedMonths = Math.round(months * 10) / 10;
    return roundedMonths % 1 === 0 ? `${roundedMonths} month${roundedMonths !== 1 ? 's' : ''}` : `${roundedMonths} month${roundedMonths !== 1 ? 's' : ''}`;
  }
  
  // 12 months or more - show years
  const years = months / 12;
  const roundedYears = Math.round(years * 10) / 10;
  return roundedYears % 1 === 0 ? `${roundedYears} year${roundedYears !== 1 ? 's' : ''}` : `${roundedYears} year${roundedYears !== 1 ? 's' : ''}`;
}

/**
 * Convert an ISO date string into a Kinyarwanda time ago format.
 * Returns time difference from now using appropriate singular/plural forms in Kinyarwanda.
 * @param dateString ISO date string (e.g., "2025-10-19T12:17:13.301Z")
 * @returns Formatted time string in Kinyarwanda (e.g., "umunota 1", "iminota 5", "isaha 1", "amasaha 3")
 */
export function formatTimeAgoKinyarwanda(dateString: string | Date | null | undefined): string {
  // Guard against null/undefined/empty values
  if (dateString === null || dateString === undefined || dateString === '') {
    return 'Igihe kitazwi';
  }

  try {
    const date = new Date(dateString as string | Date);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Igihe kitazwi';
    }

    // Calculate difference in milliseconds
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Less than 1 minute
    if (diffMinutes < 1) {
      return 'Nonaha';
    }

    // Minutes
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    }

    // Hours
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h`;
    }

    // Days
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays}d`;
    }

    // Weeks
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) {
      return `${diffWeeks}w`;
    }

    // Months
    const diffMonths = Math.floor(diffDays / 30.44); 
    if (diffMonths < 12) {
      return diffMonths === 1 ? 'ukwezi 1' : `amezi ${diffMonths}`;
    }

    // Years
    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1 ? 'umwaka 1' : `imyaka ${diffYears}`;

  } catch {
    return 'Igihe kitazwi';
  }
}

/**
 * Format an ISO date string into day/mm/yyyy format.
 * @param dateString ISO date string (e.g., "2025-10-20T13:23:40.246Z")
 * @returns Formatted date string (e.g., "20/10/2025")
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  // Guard against null/undefined/empty values
  if (dateString === null || dateString === undefined || dateString === '') {
    return 'Invalid date';
  }

  try {
    const date = new Date(dateString as string | Date);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return 'Invalid date';
  }
}

/**
 * Walk a Locations-like object and normalize any fully-uppercase name fields into Title Case.
 * This function mutates the passed object in-place.
 *
 * The shape expected is an object with `provinces[] -> districts[] -> sectors[] -> cells[] -> villages[]`
 * where each entity has a `name` property. The function is intentionally typed as `any` to avoid
 * circular type imports; it will work with the `locations` object from `utils/locations.ts`.
 */
export function fixUppercaseNames(locs: any): void {
  if (!locs || !Array.isArray(locs.provinces)) return;

  locs.provinces.forEach((province: any) => {
    if (isAllUppercaseName(province.name)) province.name = toTitleCase(province.name);
    if (!Array.isArray(province.districts)) return;
    province.districts.forEach((district: any) => {
      if (isAllUppercaseName(district.name)) district.name = toTitleCase(district.name);
      if (!Array.isArray(district.sectors)) return;
      district.sectors.forEach((sector: any) => {
        if (isAllUppercaseName(sector.name)) sector.name = toTitleCase(sector.name);
        if (!Array.isArray(sector.cells)) return;
        sector.cells.forEach((cell: any) => {
          if (isAllUppercaseName(cell.name)) cell.name = toTitleCase(cell.name);
          if (!Array.isArray(cell.villages)) return;
          cell.villages.forEach((village: any) => {
            if (isAllUppercaseName(village.name)) village.name = toTitleCase(village.name);
          });
        });
      });
    });
  });
}



// Helper function to calculate time spent on course
const calculateTimeSpent = (enrollmentDate: string | null, completedAt: string | null): string => {
  if (!enrollmentDate) return 'Igihe kitazwi';
  
  try {
    const startDate = new Date(enrollmentDate);
    const endDate = completedAt ? new Date(completedAt) : new Date(); // Use current date if not completed
    
    if (isNaN(startDate.getTime()) || (completedAt && isNaN(endDate.getTime()))) {
      return 'Igihe kitazwi';
    }
    
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    // Less than 1 minute
    if (diffMinutes < 1) {
      return 'Munsi y\'umunota';
    }
    
    // Minutes
    if (diffMinutes < 60) {
      return diffMinutes === 1 ? 'umunota 1' : `iminota ${diffMinutes}`;
    }
    
    // Hours
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return diffHours === 1 ? 'isaha 1' : `amasaha ${diffHours}`;
    }
    
    // Days
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return diffDays === 1 ? 'umunsi 1' : `iminsi ${diffDays}`;
    }
    
    // Weeks
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) {
      return diffWeeks === 1 ? 'icyumweru 1' : `ibyumweru ${diffWeeks}`;
    }
    
    // Months
    const diffMonths = Math.floor(diffDays / 30.44);
    if (diffMonths < 12) {
      return diffMonths === 1 ? 'ukwezi 1' : `amezi ${diffMonths}`;
    }
    
    // Years
    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1 ? 'umwaka 1' : `imyaka ${diffYears}`;
    
  } catch {
    return 'Igihe kitazwi';
  }
};

export default calculateTimeSpent;

const RW_MONTHS_SHORT = ['Mut.','Gas.','Wer.','Mat.','Gic.','Kam.','Nya.','Kan.','Nze.','Ukw.','Ugs.','Ukb.'];

export function formatRwDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const day = d.getDate().toString().padStart(2, '0');
  const month = RW_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}
