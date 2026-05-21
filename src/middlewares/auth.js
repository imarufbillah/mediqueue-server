const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const validateToken = async (req, res, next) => {
  try {
    // Fetch the JSON Web Key Set (JWKS)
    const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_BASE_URL}/api/auth/jwks`),
    );

    // Get the authorization header and validate it
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, message: "Authorization header missing" });
    }

    // Extract the token from the authorization header and validate it
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    // Verify the token using the JWKS
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    console.error("Token validation failed:", error);
    throw error;
  }
};

module.exports = { validateToken };
