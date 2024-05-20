import express from "express";
import { collections } from "../database";
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";

export const authRouter = express.Router();
authRouter.use(express.json());

// User Registration with JWT issuance
authRouter.post("/register", async (req, res) => {
  if(collections.users){
    try {
      
      const { firstname, lastname, role, clientid, email, password, assignedlocations, assignedzones, shiftIndex } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = {
        firstname,
        lastname,
        role,
        clientid,
        email,
        passwordHash: hashedPassword,
        assignedlocations,
        assignedzones,
        shiftIndex,
      };
  
      const result = await collections.users.insertOne(newUser);
  
      // Issue JWT upon successful registration
      const token = jwt.sign({ userId: result.insertedId, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.status(201).json({ message: `User created with ID: ${result.insertedId}`, token });
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
});  


// User Login
authRouter.post("/login", async (req, res) => {
  if(collections.users){
  try {
    const { email, password } = req.body;
    const user = await collections.users.findOne({ email });

    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const token = jwt.sign({ userId: user._id, role: user.role, clientID: user.clientid }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(200).send({ token, role: user.role, clientid: user.clientid, userID: user._id });
    } else {
      res.status(400).send("Invalid email or password");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }}
});

export default authRouter;
