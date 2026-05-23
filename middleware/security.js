const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// ── 1. RATE LIMITING ──────────────────────────────────

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: "Too many requests. Please try again after 15 minutes."
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: "Too many login attempts. Try again in 15 minutes."
    },
    handler: (req, res, next, options) => {
        console.warn(`[RATE LIMIT] Blocked login attempt from IP: ${req.ip} at ${new Date().toISOString()}`);
        res.status(options.statusCode).json(options.message);
    }
});

// ── 2. CORS ───────────────────────────────────────────

const allowedOrigins = [
    "http://localhost:4000",
    "http://localhost:5000"
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked request from: ${origin}`);
            callback(new Error("Not allowed by CORS policy"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    credentials: true
};

// ── 3. SECURITY HEADERS (Helmet + CSP + HSTS) ────────

const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: "deny" },
    noSniff: true,
    referrerPolicy: { policy: "same-origin" }
 
});

// ── 4. JWT AUTH ───────────────────────────────────────

const jwtAuth = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const secret = process.env.JWT_SECRET || "dev-secret-change-in-production";

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            console.warn(`[JWT] Invalid token from IP: ${req.ip} — ${err.message}`);
            return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
        }
        req.user = decoded;
        next();
    });
};

const generateToken = (user) => {
    const secret = process.env.JWT_SECRET || "dev-secret-change-in-production";
    return jwt.sign(
        { id: user._id, username: user.userName, isAdmin: user.isAdmin },
        secret,
        { expiresIn: "1h" }
    );
};

// ── 5. API KEY AUTH ───────────────────────────────────

const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    const validApiKey = process.env.API_KEY || "dev-api-key-change-in-production";

    if (!apiKey || apiKey !== validApiKey) {
        console.warn(`[API KEY] Invalid key from IP: ${req.ip}`);
        return res.status(401).json({ error: "Unauthorized: Invalid or missing API key" });
    }
    next();
};

module.exports = {
    generalLimiter,
    authLimiter,
    corsOptions,
    helmetConfig,
    apiKeyAuth,
    jwtAuth,
    generateToken
};