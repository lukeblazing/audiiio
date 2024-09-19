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
  validateCredentials(email, password) {
    return email === 'user@example.com' && password === 'hithere';
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
