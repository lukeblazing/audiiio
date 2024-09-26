import jwt from 'jsonwebtoken';

class AuthController {
  // Handles Login and cookie generation
  async login(req, res) {
    const { email, password } = req.body;

    // Validate provided email and password are correct
    if (!this.validateCredentials(email, password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Assuming user validation is successful, generate a JWT token
    const token = this.generateToken({ email, role: 'admin' });

    // Set the token in an HTTP-only, secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'Strict', // Protect against CSRF attacks
      maxAge: 3600000, // 1 hour expiration in milliseconds
    });

    // Respond with success
    res.status(200).json({ message: 'Login successful' });
  }

  // Validate email and password
  async validateCredentials(email, password) {
    try {
      const queryText = 'SELECT password FROM users WHERE email = $1';
      const result = {rows: []}//await pool.query(queryText, [email]);

      if (result.rows.length === 0) {
        // No user found with the given email
        return false;
      }

      const storedPasswordHash = result.rows[0].password;

      // Compare the given password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(password, storedPasswordHash);

      return passwordMatch;
    } catch (err) {
      console.error('Error validating credentials', err);
      return false;
    }
  }

  // Create a new user
  async createUser(req, res) {
    try {
      const { name, email, password } = req.body;

      // Check if the email is already in use
      const existingUserQuery = 'SELECT * FROM users WHERE email = $1';
      const existingUserResult = await pool.query(existingUserQuery, [email]);

      if (existingUserResult.rows.length > 0) {
        // If the email is already in use, return an error response
        return {
          success: false,
          message: 'Email is already in use',
        };
      }
  
      // Hash the password before storing it in the database
      const saltRounds = 10; // 10 is a good balance between security and performance
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Insert the new user into the database
      const insertUserQuery = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email';
      const result = await pool.query(insertUserQuery, [email, hashedPassword]);
  
      // Return the newly created user details (excluding the password)
      const newUser = result.rows[0];
  
      // Send back a success response with the new user details
      return {
        success: true,
        message: 'User created successfully',
        user: newUser, // Send the new user object (with id and email)
      };
      
    } catch (err) {
      console.error('Error creating user:', err);

      // Avoid thowing a 500 error
      return {
        success: false,
        message: 'An error occurred while creating the user',
        error: err.message,
      };
    }
  }

  // Generate JWT for the response cookie
  generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
  }

  // Handle Logout, clear the cookie in the user's browser
  logout(req, res) {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
  }

  // Middleware to verify the token from the cookie
  verifyToken(req, res, next) {
    const token = req.cookies.token; // Extract token from cookies

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info (email and role) to the request object
      req.user = {
        email: decoded.email,
        role: decoded.role
      };

      // Continue to the next middleware or route handler
      next();
    } catch (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
  }
}

export default new AuthController();
