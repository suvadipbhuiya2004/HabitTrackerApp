export interface Habit {
    id: number;
    name: string;
    description?: string;
    mode: 'daily' | 'weekly';
    target: number;
    time?: string; // Format: 'HH:MM'
    daysOfWeek?: {
        monday: boolean;
        tuesday: boolean;
        wednesday: boolean;
        thursday: boolean;
        friday: boolean;
        saturday: boolean;
        sunday: boolean;
    };
    createdAt: string;
    updatedAt: string;
}
