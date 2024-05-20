import * as mongodb from "mongodb";
import { Client } from "./interfaces/client";
import { User } from "./interfaces/user";
import { Message } from "./interfaces/message";

export const collections: {
    clients?: mongodb.Collection<Client>;
    users?: mongodb.Collection<User>;
    messages?: mongodb.Collection<Message>;
} = {};

export async function connectToDatabase(uri: string) {
    const client = new mongodb.MongoClient(uri);
    await client.connect();

    const db = client.db("Prototype");

    // Initialize collections
    collections.clients = db.collection<Client>("clients");
    collections.users = db.collection<User>("users");
    collections.messages = db.collection<Message>("messages");

    await applySchemaValidation(db);
}

async function applySchemaValidation(db: mongodb.Db) {
    const schemas = {
        clients: {
            $jsonSchema: {
                bsonType: "object",
                required: ["clientname", "location", "userRefs"],
                additionalProperties: false,
                properties: {
                    _id: {},
                    clientname: {
                        bsonType: "string",
                    },
                    location: {
                        bsonType: "array",
                        items: {
                            bsonType: "object",
                            required: ["locationname", "assignedusers", "zone", "record", "qrcodeenabled"],
                            additionalProperties: false,
                            properties: {
                                _id: {},
                                locationname: {
                                    bsonType: "string",
                                },
                                assignedusers: {
                                    bsonType: "array",
                                    items: {
                                        bsonType: "objectId",
                                    },
                                },
                                qrcode: {
                                    bsonType: "string",
                                },
                                qrcodeenabled: {
                                    bsonType: "boolean",
                                },
                                record: {
                                    bsonType: "array",
                                    items: {
                                        bsonType: "object",
                                        required: ["checkinRecord", "checkoutRecord", "userId"],
                                        properties: {
                                            checkinRecord: {
                                                bsonType: "string",
                                            },
                                            checkoutRecord: {
                                                bsonType: "string",
                                            },
                                            userId: {
                                                bsonType: "objectId",
                                            },
                                        },
                                    },
                                },
                                zone: {
                                    bsonType: "array",
                                    items: {
                                        bsonType: "object",
                                        required: ["zonename", "steps", "assignedusers", "qrcode", "lastcheckin", "lastcheckout", "timespent", "record", "showrecord"],
                                        additionalProperties: false,
                                        properties: {
                                            _id: {},
                                            zonename: {
                                                bsonType: "string",
                                            },
                                            steps: {
                                                bsonType: "array",
                                                items: {
                                                    bsonType: "string",
                                                },
                                            },
                                            assignedusers: {
                                                bsonType: "array",
                                                items: {
                                                    bsonType: "objectId",
                                                },
                                            },
                                            qrcode: {
                                                bsonType: "string",
                                            },
                                            lastcheckin: {
                                                bsonType: "string",
                                            },
                                            lastcheckout: {
                                                bsonType: "string",
                                            },
                                            timespent: {
                                                bsonType: "string",
                                            },
                                            record: {
                                                bsonType: "array",
                                                items: {
                                                    bsonType: "object",
                                                    required: ["checkinRecord", "checkoutRecord", "userId", "timespent", "completedSteps", "incompleteSteps"],
                                                    properties: {
                                                        checkinRecord: {
                                                            bsonType: "string",
                                                        },
                                                        checkoutRecord: {
                                                            bsonType: "string",
                                                        },
                                                        userId: {
                                                            bsonType: "objectId",
                                                        },
                                                        timespent: {
                                                            bsonType: "string",
                                                        },
                                                        completedSteps: {
                                                            bsonType: "array",
                                                            items: {
                                                                bsonType: "string",
                                                            },
                                                        },
                                                        incompleteSteps: {
                                                            bsonType: "array",
                                                            items: {
                                                                bsonType: "string",
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                            showrecord: {
                                                bsonType: "boolean",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    userRefs: {
                        bsonType: "array",
                        items: {
                            bsonType: "objectId",
                        },
                    },
                }
            }
        },
        users: {
            $jsonSchema: {
                bsonType: "object",
                required: ["firstname", "lastname", "role", "email", "passwordHash", "assignedlocations", "clientid", "assignedzones"],
                additionalProperties: false,
                properties: {
                    _id: {},
                    firstname: {
                        bsonType: "string",
                    },
                    lastname: {
                        bsonType: "string",
                    },
                    role: {
                        bsonType: "string",
                    },
                    email: {
                        bsonType: "string",
                    },
                    passwordHash: {
                        bsonType: "string",
                    },
                    assignedlocations: {
                        bsonType: "array",
                        items: {
                            bsonType: "objectId",
                        },
                    },
                    clientid: {
                        bsonType: "objectId",
                    },
                    assignedzones: {
                        bsonType: "array",
                        items: {
                            bsonType: "objectId",
                        },
                    },
                }
            }
        },
        messages: {
            $jsonSchema: {
                bsonType: "object",
                required: ["senderId", "receiverId", "messageText", "timestamp"],
                additionalProperties: false,
                properties: {
                    _id: {},
                    senderId: {
                        bsonType: "objectId",
                    },
                    receiverId: {
                        bsonType: "objectId",
                    },
                    messageText: {
                        bsonType: "string",
                    },
                    timestamp: {
                        bsonType: "date",
                    }
                }
            }
        }
    };

    for (const [collectionName, schema] of Object.entries(schemas)) {
        await db.command({
            collMod: collectionName,
            validator: schema,
        }).catch(async (error) => {
            if (error.codeName === "NamespaceNotFound") {
                await db.createCollection(collectionName, { validator: schema });
            }
        });
    }
}
