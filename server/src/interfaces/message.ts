import * as mongodb from "mongodb";

export interface Message {
    _id: mongodb.ObjectId;
    senderId: mongodb.ObjectId;
    receiverId: mongodb.ObjectId;
    messageText: string;
    timestamp: Date;
  }
  