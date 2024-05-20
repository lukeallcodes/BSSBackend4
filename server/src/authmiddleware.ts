// authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  role: string;
  // Add other relevant properties based on your JWT payload
}

// Extend the Request interface to include the user property
interface AuthenticatedRequest extends Request {
  user?: DecodedToken;
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Get the token from the Authorization header
  console.log("Auth Middleware Engaged! {{Backend}}");
  const token = req.header('Authorization');

  // Check if the token is present
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;
    req.user = decoded; // Attach the user information to the request object
    next(); // Continue to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
  
};

export default authMiddleware;
