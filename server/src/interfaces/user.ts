import * as mongodb from "mongodb";

export interface User{

    firstname: string;
    lastname: string;
    role: string;
    email: string;
    passwordHash?: string;
    assignedlocations?: mongodb.ObjectId[];
    assignedzones?: mongodb.ObjectId[];
    clientid?: mongodb.ObjectId;
    _id?: mongodb.ObjectId;
    shiftIndex: number;
}