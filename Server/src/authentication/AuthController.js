import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../database/db.js'; // Ensure you have a db.js that exports your database pool
import { parseCookies } from './authUtils.js';

class AuthController {
  // Handles Login and cookie generation
  async login(req, res) {
    const { email, password } = req.body;

    // Validate provided email and password are correct
    const credentialsResult = await this.getCredentials(email, password);
    if (!credentialsResult.passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = this.generateToken({ email, name: credentialsResult.storedName, role: credentialsResult.storedUserRole });

    // Set the token in an HTTP-only, secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'Strict', // Protect against CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day expiry
    });

    // Respond with success
    res.status(200).json({
      message: 'Login successful',
      user: { email, name: credentialsResult.storedName, role: credentialsResult.storedUserRole },
    });
  }

  // Validate email and password
  async getCredentials(email, password) {
    try {
      const queryText = 'SELECT password, name, role FROM app_users WHERE lower(email) = lower($1)';
      const result = await pool.query(queryText, [email]);

      if (result.rows.length === 0) {
        // No user found with the given email
        return false;
      }

      const storedPasswordHash = result.rows[0].password;
      const storedUserRole = result.rows[0].role;
      const storedName = result.rows[0].name;

      // Compare the given password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(password, storedPasswordHash);

      return { passwordMatch, storedUserRole, storedName };
    } catch (err) {
      console.error('Error validating credentials', err);
      return { error: `Error validating credentials: ${err.message}` };
    }
  }

  // Create a new user and automatically log them in
  async createUser(req, res) {
    try {
      const { email, name, password } = req.body;

      const blockingNewUsers = false;
      if (blockingNewUsers) {
        return res.status(400).json({
          success: false,
          message: 'We are currently at capacity. We are not accepting new users at this time.',
        });
      }

      // Check if the email is already in use
      const existingUserQuery = 'SELECT * FROM app_users WHERE email = $1';
      const existingUserResult = await pool.query(existingUserQuery, [email]);

      if (existingUserResult.rows.length > 0) {
        // If the email is already in use, return an error response
        return res.status(400).json({
          success: false,
          message: 'Email is already in use',
        });
      }

      // Hash the password before storing it in the database
      const saltRounds = 10; // 10 is a good balance between security and performance
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert the new user into the database
      const insertUserQuery = 'INSERT INTO app_users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING email, name, role';
      const result = await pool.query(insertUserQuery, [email, hashedPassword, name, 'user']);

      // Return the newly created user details (excluding the password)
      const newUser = result.rows[0];

      // Generate a JWT token for the new user
      const token = this.generateToken({ name: newUser.name, email: newUser.email, role: 'user' });

      // Set the token in an HTTP-only, secure cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'Strict', // Protect against CSRF attacks
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day expiry
      });

      // Send back a success response with the new user details
      res.status(201).json({
        success: true,
        message: 'User created and logged in successfully',
        user: {
          name: newUser.name,
        },
      });

    } catch (err) {
      console.error('Error creating user:', err);

      // Send a 500 error response
      res.status(500).json({
        success: false,
        message: 'An error occurred while creating the user',
        error: err.message,
      });
    }
  }

  // Generate JWT for the response cookie
  generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
  }

  // Handle Logout, clear the cookie in the user's browser
  logout(req, res) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'Strict',
    });
    res.status(200).json({ message: 'Logout successful' });
  }

  // Middleware to verify the token from the cookie
  verifyToken(req, res, next) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies['token'];
    const accessCodeToken = cookies['access_code_token'];

    if (!token || !accessCodeToken) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Verify the access code token using the secret key
      const decodedAccessCode = jwt.verify(accessCodeToken, process.env.JWT_SECRET);

      // Attach user info (email and role) to the request object
      req.user = {
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        has_access_code: true,
        access_code: decodedAccessCode.access_code
      };

      // If less than 5 days left, issue a new token and set it in the cookie
      const now = Math.floor(Date.now() / 1000);

      const timeLeft = decoded.exp - now;
      const timeLeftAccessCode = decodedAccessCode.exp - now;

      const FIVE_DAYS_IN_SECONDS = 5 * 24 * 60 * 60;

      // Refresh main token if needed
      if (timeLeft < FIVE_DAYS_IN_SECONDS) {
        const newToken = this.generateToken({
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        });

        res.cookie('token', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV !== 'development',
          sameSite: 'Strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day expiry
        });
      }

      // Refresh access code token if needed
      if (timeLeftAccessCode < FIVE_DAYS_IN_SECONDS) {
        const newAccessCodeToken = this.generateAccessCodeToken({
          access_code: decodedAccessCode.access_code,
        });

        res.cookie('access_code_token', newAccessCodeToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV !== 'development',
          sameSite: 'Strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      // Continue to the next middleware or route handler
      next();
    } catch (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
  }

  // Middleware to verify the token from the cookie
  verifyOptionalToken(req, res, next) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies['token'];
    const accessCodeToken = cookies['access_code_token'];

    if (!accessCodeToken) {
      return res.status(403).json({ message: 'No access code provided.' });
    }

    try {
      // Verify the access code token using the secret key
      const decodedAccessCode = jwt.verify(accessCodeToken, process.env.JWT_SECRET);
      req.user = {
        has_access_code: true,
        access_code: decodedAccessCode.access_code
      }

      if (token) {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info (email and role) to the request object
        req.user = {
          ...req.user,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role
        };
      }

      // Continue to the next middleware or route handler
      next();
    } catch (err) {
      return res.status(403).json({ message: 'No access code or auth token provided.' });
    }
  }

  // Sign up a guest user with their provided access code
  async submitAccessCode(req, res) {
    try {
      const { accessCode } = req.body;

      if (
        !accessCode ||
        accessCode.toString() !== process.env.ACCESS_CODE
      ) {
        return res.status(401).json({ valid: false, message: 'Invalid access code.' });
      }

      // Create a JWT for access code, with minimal claims
      const accessCodeToken = this.generateToken({ access_code: accessCode.toString() });

      // Set the cookie
      res.cookie('access_code_token', accessCodeToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'Strict', // Protect against CSRF attacks
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day expiry
      });

      return res.status(200).json({ valid: true, message: 'Access code accepted.' });
    } catch (error) {
      console.error('Error in submitAccessCode:', error);
      return res.status(500).json({ valid: false, message: 'Server error.' });
    }
  }
}

export default new AuthController();
