// Date Props type checking for date validation

export const isValidDate = (dateString: string, format: string = 'DD-MM-YYYY'): boolean => {
    // Define regex patterns for both formats
    const ddmmyyyyRegex = /^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-(\d{4})$/;
    const yyyymmddRegex = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    let day: number, month: number, year: number;

    if (format === 'DD-MM-YYYY') {
        if (!ddmmyyyyRegex.test(dateString)) {
            return false;
        }
        [day, month, year] = dateString.split('-').map(Number);
    } else if (format === 'YYYY-MM-DD') {
        if (!yyyymmddRegex.test(dateString)) {
            return false;
        }
        [year, month, day] = dateString.split('-').map(Number);
    } else {
        // Unsupported format
        return false;
    }

    if (month < 1 || month > 12) { return false; }
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
        daysInMonth[1] = 29;
    }

    return day >= 1 && day <= daysInMonth[month - 1];
};

// Convert from YYYY-MM-DD to DD-MM-YYYY format (for display)
export function convertToDisplayDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
}

// Convert from DD-MM-YYYY to YYYY-MM-DD format (for database)
export function convertToDatabaseDate(dateStr: string): string {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
}
