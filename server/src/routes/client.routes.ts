import express from "express";
import { collections } from "../database";
import { ObjectId } from "mongodb";
import * as QRCode from 'qrcode';
import { Location } from "../interfaces/location"
export const clientRouter = express.Router();


// Get all clients
clientRouter.get("/", async (req, res) => {
  if(collections.clients){
  try {
    const clients = await collections.clients.find().toArray();
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).send("Internal Server Error");
  }}
});

// Add a new client
clientRouter.post("/add", async (req, res) => {
  if(collections.clients){
  try {
    const newClient = req.body;
    // Add the new client to the database
    const result = await collections.clients.insertOne(newClient);

    // Retrieve the inserted document ID
    const insertedClientId: ObjectId = result.insertedId;

    // Fetch the complete document using the ID
    const insertedClient = await collections.clients.findOne({ _id: insertedClientId });

    // Send the inserted client back in the response
    res.json(insertedClient);
  } catch (error) {
    console.error("Error adding client:", error);
    res.status(500).send("Internal Server Error");
  }}
});

clientRouter.put("/update", async (req, res) => {
  if (collections.clients) {
    try {
      const updatedClient = req.body;

      // Check if the _id is a valid ObjectId
      if (!ObjectId.isValid(updatedClient._id)) {
        console.error("Invalid client ID format");
        return res.status(400).json({ error: "Invalid client ID format" });
      }

      // Exclude the _id field from the update operation
      const { _id, ...updatedClientWithoutId } = updatedClient;

      // Ensure each location has an _id, initializing it if necessary
      if (updatedClientWithoutId.location && Array.isArray(updatedClientWithoutId.location)) {
        await Promise.all(updatedClientWithoutId.location.map(async (location: {
          record: boolean; _id: ObjectId; zone: any[]; qrcode: string; qrcodeenabled: boolean 
}) => {
          if (!location._id) {
            location._id = new ObjectId();
          }
          // Generate QR code for the location if it doesn't exist and qrcodeenabled is not set to false
          if (!location.qrcode && location.qrcodeenabled !== false) {
            location.qrcode = await QRCode.toDataURL(location._id.toString());
          } else if (location.qrcodeenabled === false) {
            location.qrcode = null; // Remove QR code if disabled
          }
          if (location.zone && Array.isArray(location.zone)) {
            await Promise.all(location.zone.map(async (zone: { _id: ObjectId; qrcode: string; }) => {
              if (!zone._id) {
                zone._id = new ObjectId();
              }
              // Generate QR code if it doesn't exist
              if (!zone.qrcode) {
                zone.qrcode = await QRCode.toDataURL(zone._id.toString());
              }
            }));
          }
          
          // Ensure each location record has a userId, checkinRecord, and checkoutRecord
          if (location.record && Array.isArray(location.record)) {
            location.record.forEach(record => {
              if (!record.userId) {
                console.error("Missing userId in location record");
                return res.status(400).json({ error: "Missing userId in location record" });
              }
              if (!record.checkinRecord) {
                record.checkinRecord = new Date();
              }
              if (!record.checkoutRecord) {
                record.checkoutRecord = null;
              }
            });
          }
        }));
      }

      // Update the client in the database
      const updateResult = await collections.clients.updateOne(
        { _id: new ObjectId(updatedClient._id) },
        { $set: updatedClientWithoutId }
      );

      // Check if the client was found and updated
      if (updateResult.matchedCount === 0) {
        console.error("Client not found");
        return res.status(404).json({ error: "Client not found" });
      }

      // Use a short delay to ensure data consistency before fetching updated data
      setTimeout(async () => {
        const updatedClientFromDb = await collections.clients.findOne({ _id: new ObjectId(updatedClient._id) });
        console.log(updatedClientFromDb.location[0]);
        res.json({ client: updatedClientFromDb });
      }, 1000);  // Adjust delay as necessary based on performance and testing

    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).send("Internal Server Error");
    }
  }
});



// Delete a client
clientRouter.delete("/delete/:clientId", async (req, res) => {
  if(collections.clients){
  try {
    const clientId = req.params.clientId;

    // Check if the clientId is a valid ObjectId
    if (!ObjectId.isValid(clientId)) {
      console.error("Invalid client ID format");
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // Delete the client from the database
    const deleteResult = await collections.clients.deleteOne({ _id: new ObjectId(clientId) });

    // Check if the client was found and deleted
    if (deleteResult.deletedCount === 0) {
      console.error("Client not found");
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).send("Internal Server Error");
  }}
});

clientRouter.delete("/deleteLocation/:clientId/:locationId", async (req, res) => {
  if(collections.clients){
  try {
    const clientId = req.params.clientId;
    const locationId = req.params.locationId;

    // Check if the clientId and locationId are valid ObjectIds
    if (!ObjectId.isValid(clientId) || !ObjectId.isValid(locationId)) {
      console.error("Invalid client or location ID format");
      return res.status(400).json({ error: "Invalid client or location ID format" });
    }

    // Fetch the client document
    const client = await collections.clients.findOne({ _id: new ObjectId(clientId) });

    // Check if the client exists
    if (!client) {
      console.error("Client not found");
      return res.status(404).json({ error: "Client not found" });
    }

    // Find the location index
    const locationIndex = client.location.findIndex(loc => loc._id.toString() === locationId);

    // Check if the location exists
    if (locationIndex === -1) {
      console.error("Location not found");
      return res.status(404).json({ error: "Location not found" });
    }

    // Remove the location from the client in memory
    client.location.splice(locationIndex, 1);

    // Update the client in the database
    await collections.clients.updateOne({ _id: new ObjectId(clientId) }, { $set: { location: client.location } });

    res.json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).send("Internal Server Error");
  }}
});



clientRouter.delete("/deleteZone/:clientId/:locationId/:zoneId", async (req, res) => {
  if(collections.clients){
  try {
    const clientId = req.params.clientId;
    const locationId = req.params.locationId;
    const zoneId = req.params.zoneId;

    // Check if the clientId, locationId, and zoneId are valid ObjectIds
    if (!ObjectId.isValid(clientId) || !ObjectId.isValid(locationId) || !ObjectId.isValid(zoneId)) {
      console.error("Invalid client, location, or zone ID format");
      return res.status(400).json({ error: "Invalid client, location, or zone ID format" });
    }

    // Fetch the client document
    const client = await collections.clients.findOne({ _id: new ObjectId(clientId) });

    // Check if the client exists
    if (!client) {
      console.error("Client not found");
      return res.status(404).json({ error: "Client not found" });
    }

    // Find the location index
    const locationIndex = client.location.findIndex(loc => loc._id.toString() === locationId);

    // Check if the location exists
    if (locationIndex === -1) {
      console.error("Location not found");
      return res.status(404).json({ error: "Location not found" });
    }

    // Find the zone index
    const zoneIndex = client.location[locationIndex].zone.findIndex(z => z._id.toString() === zoneId);

    // Check if the zone exists
    if (zoneIndex === -1) {
      console.error("Zone not found");
      return res.status(404).json({ error: "Zone not found" });
    }

    // Remove the zone from the location in memory
    client.location[locationIndex].zone.splice(zoneIndex, 1);

    // Update the client in the database
    await collections.clients.updateOne({ _id: new ObjectId(clientId) }, { $set: { location: client.location } });

    res.json({ message: "Zone deleted successfully" });
  } catch (error) {
    console.error("Error deleting zone:", error);
    res.status(500).send("Internal Server Error");
  }}
});

// Delete a step
clientRouter.delete("/deleteStep/:clientId/:locationId/:zoneId/:stepId", async (req, res) => {
  if(collections.clients){
  try {
    const clientId = req.params.clientId;
    const locationId = req.params.locationId;
    const zoneId = req.params.zoneId;
    const stepId = req.params.stepId;

    // Check if the clientId, locationId, zoneId, and stepId are valid ObjectIds
    if (!ObjectId.isValid(clientId) || !ObjectId.isValid(locationId) || !ObjectId.isValid(zoneId) || !ObjectId.isValid(stepId)) {
      console.error("Invalid client, location, zone, or step ID format");
      return res.status(400).json({ error: "Invalid client, location, zone, or step ID format" });
    }

    // Delete the step from the zone's steps array
    const updateResult = await collections.clients.updateOne(
      { _id: new ObjectId(clientId), "location._id": new ObjectId(locationId), "location.zone._id": new ObjectId(zoneId) },
      { $pull: { "location.$.zone.$.steps": { _id: new ObjectId(stepId) } } }
    );

    // Check if the step was found and deleted
    if (updateResult.matchedCount === 0 || updateResult.modifiedCount === 0) {
      console.error("Step not found");
      return res.status(404).json({ error: "Step not found" });
    }

    res.json({ message: "Step deleted successfully" });
  } catch (error) {
    console.error("Error deleting step:", error);
    res.status(500).send("Internal Server Error");
  }}
});

// Route to get QR code for a specific zone
clientRouter.get('/:clientId/locations/:locationId/zones/:zoneId/qrcode', async (req, res) => {
  if(collections.clients){
  const { clientId, locationId, zoneId } = req.params;

  // Validate ObjectIds
  if (!ObjectId.isValid(clientId) || !ObjectId.isValid(locationId) || !ObjectId.isValid(zoneId)) {
      console.error("Invalid IDs format");
      return res.status(400).json({ error: "Invalid ID format for client, location, or zone" });
  }

  try {
      // Fetch the client
      const client = await collections.clients.findOne({
          _id: new ObjectId(clientId),
          'location._id': new ObjectId(locationId),
          'location.zone._id': new ObjectId(zoneId)
      });

      if (!client) {
          console.error("Client not found");
          return res.status(404).json({ error: "Client not found" });
      }

      // Find the specific zone
      const location = client.location.find(loc => loc._id.toString() === locationId);
      if (!location) {
          console.error("Location not found");
          return res.status(404).json({ error: "Location not found" });
      }

      const zone = location.zone.find(z => z._id.toString() === zoneId);
      if (!zone) {
          console.error("Zone not found");
          return res.status(404).json({ error: "Zone not found" });
      }
     

      // Respond with the QR code data
      res.json({ qrcode: zone.qrcode });
  } catch (error) {
      console.error("Error fetching QR code:", error);
      res.status(500).send("Internal Server Error");
  }
}
});


export default clientRouter;
