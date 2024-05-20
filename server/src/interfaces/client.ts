import * as mongodb from "mongodb";
import { Location } from "./location";

// Define a Shift interface to represent each shift's details
export interface Shift {
    shiftStartTime: Date;
    shiftEndTime: Date;
}

export interface Client {
    clientname: string;
    location: Location[];
    userRefs: mongodb.ObjectId[]; // Array of references to User objects
    shifts: Shift[];             // Array of shifts, each with a start and end time
    _id?: mongodb.ObjectId;
}
