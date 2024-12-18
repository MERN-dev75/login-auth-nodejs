import userShema from "../modal/loginModal.js"
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "accessSecretKey";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refreshSecretKey";

// Generate Access Token
export const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id, username: user.username, email: user.email }, ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });
};

// Generate Refresh Token
export const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });
};

export const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if all required fields are provided
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required." });
        }

        // Check if the username or email already exists
        const existingUser = await userShema.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ message: "Username or email already exists." });
        }

        // Hash the password before saving it to the database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user
        const newUser = new userShema({
            username,
            email,
            password: hashedPassword,
        });

        // Save the user to the database
        const result = await newUser.save();

        // Return a success response
        res.status(201).json({
            message: "User registered successfully.",
            user: { id: result._id, username: result.username, email: result.email },
        });
    } catch (error) {
        // Handle duplicate key error (e.g., unique fields like username or email)
        if (error.code === 11000) {
            return res.status(409).json({ message: "Duplicate key error: Username or email already exists." });
        }

        // Handle other errors
        console.error("Error during signup:", error);
        res.status(500).json({ message: "An error occurred during signup." });
    }
}

export const login = async (req, res) => {
    try {
        const { username } = req.body;

        // Ensure the query waits for the result
        const user = await userShema.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("User found:", user);
        return res.status(200).json(user);
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ error: "An error occurred during login" });
    }
};

export const verifyPassword = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if both username and password are provided
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        const user = await userShema.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Verify the password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password." });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Optionally, save the refresh token in the database
        user.refreshToken = refreshToken;
        await user.save();

        // Exclude sensitive fields before sending the response
        const { createdAt, updatedAt, __v, password: _ ,  ...userWithoutSensitiveData } = user.toObject();

        // Return a success response (exclude sensitive data)
        console.log("User authenticated successfully:", userWithoutSensitiveData);
        return res.status(200).json({
            message: "Login successful.",
            accessToken,
            refreshToken,
            data: userWithoutSensitiveData
        });
    } catch (error) {
        console.error("Error during password verification:", error);
        return res.status(500).json({ error: "An error occurred during verification." });
    }
}

export const verfyJWT = async (req, res) => {
    try {
        const { token } = req.body;

        // Validate request body
        if (!token) {
            return res.status(400).json({ error: "Token is required." });
        }

        // Verify the token
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

        console.log("Decoded Token:", decoded);

        // Return success response with decoded token data
        return res.status(200).json({
            message: "Token is valid.",
            userId: decoded.id,
            username: decoded.username,
            email: decoded.email,
        });
    } catch (error) {
        console.error("JWT Verification Error:", error.message);

        // Handle specific JWT errors
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token has expired." });
        } else if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ error: "Invalid token." });
        }

        // Fallback for other errors
        return res.status(500).json({ error: "An error occurred during token verification." });
    }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required." });
    }

    // Verify the refresh token
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired refresh token." });
      }

      const user = await userShema.findById(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ message: "Invalid refresh token." });
      }

      // Generate a new access token
      const accessToken = generateAccessToken(user);
      res.status(200).json({ accessToken });
    });
  } catch (error) {
    console.error("Error during token refresh:", error);
    res.status(500).json({ message: "An error occurred while refreshing the token." });
  }
};

