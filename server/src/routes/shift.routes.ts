import express from "express";
import { collections } from "../database";
import * as mongodb from "mongodb";
export const shiftRouter = express.Router();

// POST endpoint to add a new shift
shiftRouter.post('/:clientId/shifts', async (req, res) => {
    if(collections.clients){
    const { shiftStartTime, shiftEndTime } = req.body;
    const clientId = req.params.clientId;

    try {
        const updateResult = await collections.clients.updateOne(
            { _id: new mongodb.ObjectId(clientId) },
            { $push: { shifts: { shiftStartTime, shiftEndTime } } }
        );

        if (updateResult.modifiedCount === 1) {
            res.status(200).json({ message: "Shift Added Successfully"});
           
        } else {
            res.status(404).send('Client not found.');
        }
    } catch (error) {
        res.status(500).send('Error adding shift: ' + error.message);
    }

}
});

// GET endpoint to retrieve all shifts for a client
shiftRouter.get('/:clientId/shifts', async (req, res) => {
    if(collections.clients){
    const clientId = req.params.clientId;

    try {
        const client = await collections.clients.findOne(
            { _id: new mongodb.ObjectId(clientId) }
        );

        if (client) {
            res.status(200).json(client.shifts);
        } else {
            res.status(404).send('Client not found.');
        }
    } catch (error) {
        res.status(500).send('Error retrieving shifts: ' + error.message);
    }}
});

// PUT endpoint to update a specific shift
shiftRouter.put('/:clientId/shifts/:shiftIndex', async (req, res) => {
    if(collections.clients){
    const { shiftStartTime, shiftEndTime } = req.body;
    const { clientId, shiftIndex } = req.params;
    try {
        const updateResult = await collections.clients.updateOne(
            { _id: new mongodb.ObjectId(clientId), [`shifts.${shiftIndex}`]: { $exists: true } },
            { $set: { [`shifts.${shiftIndex}`]: { shiftStartTime, shiftEndTime } } }
        );

        if (updateResult.modifiedCount === 1) {
            res.status(200).json({ message: "Shift Updated Successfully"});
        } else {
            res.status(404).send('Shift or client not found.');
        }
    } catch (error) {
        res.status(500).send('Error updating shift: ' + error.message);
    }}
});



// DELETE endpoint to remove a specific shift
shiftRouter.delete('/:clientId/shifts/:shiftIndex', async (req, res) => {
    if(collections.clients){
    const { clientId } = req.params;
    const shiftIndex = parseInt(req.params.shiftIndex); // Convert shiftIndex to a number

    if (isNaN(shiftIndex)) {
        res.status(400).send('Invalid shift index.');
        return;
    }

    try {
        const client = await collections.clients.findOne(
            { _id: new mongodb.ObjectId(clientId) }
        );

        if (!client || !client.shifts || shiftIndex < 0 || shiftIndex >= client.shifts.length) {
            res.status(404).send('Shift or client not found.');
            return;
        }

        const shiftToDelete = client.shifts[shiftIndex];

        const updateResult = await collections.clients.updateOne(
            { _id: new mongodb.ObjectId(clientId) },
            { $pull: { shifts: { shiftStartTime: shiftToDelete.shiftStartTime, shiftEndTime: shiftToDelete.shiftEndTime } } }
        );

        if (updateResult.modifiedCount === 1) {
            res.status(200).json({ message: "Shift deleted successfully."});
           
        } else {
            res.status(404).send('Shift or client not found.');
        }
    } catch (error) {
        res.status(500).send('Error deleting shift: ' + error.message);
    } }
});




