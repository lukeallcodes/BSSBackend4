import express from "express";
import { collections } from "../database";
import { ObjectId } from "mongodb";

export const userRouter = express.Router();

// Get all users
userRouter.get("/", async (req, res) => {
  if (collections.users) {
    try {
      const users = await collections.users.find().toArray();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.status(500).send("User collection not available");
  }
});

// Create a new user
// Create a new user
userRouter.post("/", async (req, res) => {
  if (collections.users) {
    try {
      const newUser = req.body;

      // You may want to add validation here to ensure required fields are provided

      const insertResult = await collections.users.insertOne(newUser);

      if (insertResult.insertedId) {
        res.status(201).json({ message: "User created successfully", user: newUser });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(500).send("User collection not available");
  }
});



// Update a user
userRouter.put('/update', async (req, res) => {
  if (collections.users) {
    try {
      const { _id, ...updatedUser } = req.body;

   

      if (!ObjectId.isValid(_id)) {
        return res.status(400).send("Invalid user ID");
      }

      const updateResult = await collections.users.updateOne(
        { _id: new ObjectId(_id) },
        { $set: updatedUser }
      );

      if (updateResult.modifiedCount === 1) {
        res.status(200).json({ message: "User updated successfully" });
      } else {
        res.status(404).json({ message: "User not found or no changes made" });
      }
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(500).send("User collection not available");
  }
});

// Delete a user by ID
userRouter.delete("/delete/:userId", async (req, res) => {
  if (!collections.users) {
    return res.status(500).send("User collection not available");
  }

  const userId = req.params.userId;
  if (!ObjectId.isValid(userId)) {
    return res.status(400).send("Invalid user ID");
  }

  try {
    const deleteResult = await collections.users.deleteOne({ _id: new ObjectId(userId) });
    if (deleteResult.deletedCount === 1) {
      res.status(200).json({ message: "User deleted successfully." });

    } else {
      res.status(404).send("User not found.");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Internal Server Error");
  }
});


// Get a single user by ID
userRouter.get("/:userId", async (req, res) => {
  if (collections.users) {
    try {
      const userId = req.params.userId;

      if (!ObjectId.isValid(userId)) {
        return res.status(400).send("Invalid user ID");
      }

      const user = await collections.users.findOne({ _id: new ObjectId(userId) });

      if (user) {
        res.json(user);
      } else {
        res.status(404).send("User not found");
      }
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.status(500).send("User collection not available");
  }
});

userRouter.post("/message", async (req, res) => {
  if(collections.users && collections.messages){
  const { senderId, recipientId, messageText } = req.body;

  try {
    console.log("Sender ID:", senderId);
    console.log("Recipient ID:", recipientId);

    const sender = await collections.users.findOne({ _id: new ObjectId(senderId) });
    console.log("Sender:", sender);
    if (!sender) {
      console.log("Sender not found.");
      return res.status(404).send("Sender not found.");
    }

    if (!sender.clientid) {
      console.log("Client ID not specified for sender.");
      return res.status(400).send("Client ID not specified for sender.");
    }

    const client = await collections.clients.findOne({ _id: new ObjectId(sender.clientid) });
    console.log("Client:", client);
    if (!client || !client.userRefs) {
      console.log("Client not found for sender.");
      return res.status(404).send("Client not found for sender.");
    }

    // Retrieve all users assigned to this client
    const users = await collections.users.find({
      _id: { $in: client.userRefs.map(id => new ObjectId(id)) }
    }).toArray();
    console.log("Users assigned to client:", users);

    // Find the manager among these users
    const manager = users.find(user => user.role === 'manager');
    console.log("Manager:", manager);
    if (!manager) {
      console.log("Manager not found in the same client.");
      return res.status(404).send("Manager not found in the same client.");
    }

    // Check if the sender is a manager or an employee
    if (sender.role === 'manager') {
      // If the sender is a manager, send the message to the selected employee
      console.log("Recipient ID:", recipientId);
      if (!recipientId) {
        console.log("Recipient ID not specified.");
        return res.status(400).send("Recipient ID not specified.");
      }

      const recipient = users.find(user => user._id.toString() === recipientId);
      console.log("Recipient:", recipient);
      if (!recipient) {
        console.log("Recipient not found.");
        return res.status(404).send("Recipient not found.");
      }

      const message = {
        _id: new ObjectId(),
        senderId: new ObjectId(senderId),
        receiverId: new ObjectId(recipientId),
        messageText,
        timestamp: new Date()
      };

      await collections.messages.insertOne(message);
      console.log("Message sent successfully to the recipient.");
      return res.status(201).send("Message sent successfully to the recipient.");
    } else {
      // If the sender is an employee, send the message to the manager
      const message = {
        _id: new ObjectId(),
        senderId: new ObjectId(senderId),
        receiverId: manager._id,
        messageText,
        timestamp: new Date()
      };

      await collections.messages.insertOne(message);
      console.log("Message sent successfully to manager.");
      return res.status(201).send("Message sent successfully to manager.");
    }
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).send("Internal Server Error");
  }}
});





// Get messages for a user
// Get messages for a user
userRouter.get("/:userId/messages", async (req, res) => {
  if(collections.users && collections.messages){
    const userId = req.params.userId;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).send("Invalid user ID");
    }

    try {
      const messages = await collections.messages.find({
        $or: [
          { senderId: new ObjectId(userId) },
          { receiverId: new ObjectId(userId) }
        ]
      }).toArray();

      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.status(500).send("Message collection not available");
  }
});


// Delete a message
userRouter.delete("/message/:messageId", async (req, res) => {
  if(collections.users && collections.messages){
    const messageId = req.params.messageId;

    if (!ObjectId.isValid(messageId)) {
      return res.status(400).send("Invalid message ID");
    }

    const deleteResult = await collections.messages.deleteOne({ _id: new ObjectId(messageId) });

    if (deleteResult.deletedCount === 1) {
      res.status(200).send("Message deleted successfully.");
    } else {
      res.status(404).send("Message not found.");
    }
  } else {
    res.status(500).send("Message collection not available");
  }
});

// Update a message
userRouter.put("/message/:messageId", async (req, res) => {
  if(collections.users && collections.messages){
    const messageId = req.params.messageId;
    const { newText } = req.body; // Assuming you're updating the text of the message

    if (!ObjectId.isValid(messageId)) {
      return res.status(400).send("Invalid message ID");
    }

    const updateResult = await collections.messages.updateOne(
      { _id: new ObjectId(messageId) },
      { $set: { messageText: newText } }
    );

    if (updateResult.modifiedCount === 1) {
      res.status(200).send("Message updated successfully.");
    } else {
      res.status(404).send("Message not found or no changes made.");
    }
  } else {
    res.status(500).send("Message collection not available");
  }
});
