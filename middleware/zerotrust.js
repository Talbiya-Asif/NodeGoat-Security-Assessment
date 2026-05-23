/**
 * Zero Trust Security Middleware
 * Principle: Never trust, always verify
 */

const jwt = require("jsonwebtoken");

// ── 1. VERIFY EVERY REQUEST ───────────────────────
const zeroTrustAuth = (req, res, next) => {
    // Always verify session exists
    if (!req.session || !req.session.userId) {
        console.warn(`[ZERO TRUST] Unauthenticated request to ${req.path} from ${req.ip}`);
        return res.redirect("/login");
    }

    // Verify JWT token is still valid
    if (req.session.token) {
        const secret = process.env.JWT_SECRET || "dev-secret-change-in-production";
        jwt.verify(req.session.token, secret, (err) => {
            if (err) {
                console.warn(`[ZERO TRUST] Invalid/expired token for userId: ${req.session.userId}`);
                req.session.destroy();
                return res.redirect("/login");
            }
            next();
        });
    } else {
        next();
    }
};

// ── 2. LEAST PRIVILEGE ────────────────────────────
// Users can only access their OWN data
const ownDataOnly = (req, res, next) => {
    const requestedUserId = parseInt(req.params.userId);
    const sessionUserId = parseInt(req.session.userId);

    if (requestedUserId && requestedUserId !== sessionUserId) {
        console.warn(`[ZERO TRUST] User ${sessionUserId} attempted to access data of user ${requestedUserId}`);
        return res.status(403).render("error", {
            error: "Access Denied: You can only access your own data."
        });
    }
    next();
};

// ── 3. ACCESS LOGGING ─────────────────────────────
const accessLog = (req, res, next) => {
    const userId = req.session ? req.session.userId : "anonymous";
    console.log(`[ACCESS LOG] ${new Date().toISOString()} | User: ${userId} | ${req.method} ${req.path} | IP: ${req.ip}`);
    next();
};

// ── 4. ADMIN ONLY GUARD ───────────────────────────
const adminOnly = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect("/login");
    }
    // Check admin flag in session
    if (!req.session.isAdmin) {
        console.warn(`[ZERO TRUST] Non-admin user ${req.session.userId} attempted to access admin route`);
        return res.status(403).json({ error: "Access Denied: Admins only" });
    }
    next();
};

module.exports = {
    zeroTrustAuth,
    ownDataOnly,
    accessLog,
    adminOnly
};