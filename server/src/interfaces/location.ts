import * as mongodb from "mongodb";
import { Zone } from "./zone";

interface RecordEntryLocation {
    checkinRecord: string;
    checkoutRecord: string;
    userId: string | undefined;

}

export interface Location{

    locationname: string;
    assignedusers: mongodb.ObjectId[];
    qrcode: string;
    qrcodeenabled: boolean;
    record: RecordEntryLocation[];
    zone: Zone[];
    _id: mongodb.ObjectId;

}
