import * as mongodb from "mongodb";

interface RecordEntry {
    checkinRecord: string;
    checkoutRecord: string;
    userId: string | undefined;
    timespent: string;
    completedSteps: string[]; // Add completed steps property
    incompleteSteps: string[]; // Add incomplete steps property
}

export interface Zone {
    zonename: string;
    steps: string[];
    qrcode: string;
    lastcheckin: string;
    lastcheckout: string;
    timespent: string;
    record: RecordEntry[]; // Array of RecordEntry objects
    assignedusers: mongodb.ObjectId[];
    showRecord?: boolean;
    _id: mongodb.ObjectId;
}
