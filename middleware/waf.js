/**
 * Web Application Firewall (WAF) Middleware
 * Blocks malicious requests before they reach the app
 */

// ── MALICIOUS PATTERNS ────────────────────────────
const XSS_PATTERNS = [
    /<script>/i,
    /<\/script>/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /eval\(/i,
    /document\.cookie/i
];

const SQLI_PATTERNS = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /union.*select/i,
    /drop.*table/i,
    /insert.*into/i,
    /delete.*from/i
];

const PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//,
    /\.\.%2f/i,
    /%2e%2e%2f/i
];

const SUSPICIOUS_USER_AGENTS = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /nmap/i,
    /masscan/i,
    /dirbuster/i,
    /hydra/i
];

// ── WAF MIDDLEWARE ────────────────────────────────
const waf = (req, res, next) => {
    const ip = req.ip;
    const userAgent = req.headers["user-agent"] || "";
    const url = req.url;
    const body = JSON.stringify(req.body || {});

    // 1. Block suspicious user agents
    for (const pattern of SUSPICIOUS_USER_AGENTS) {
        if (pattern.test(userAgent)) {
            console.warn(`[WAF] Blocked suspicious user agent: ${userAgent} from IP: ${ip}`);
            return res.status(403).json({ error: "Forbidden: Suspicious client detected" });
        }
    }

    // 2. Check URL for path traversal
    for (const pattern of PATH_TRAVERSAL_PATTERNS) {
        if (pattern.test(url)) {
            console.warn(`[WAF] Blocked path traversal attempt: ${url} from IP: ${ip}`);
            return res.status(403).json({ error: "Forbidden: Invalid request" });
        }
    }

    // 3. Check body for XSS
    for (const pattern of XSS_PATTERNS) {
        if (pattern.test(body)) {
            console.warn(`[WAF] Blocked XSS attempt from IP: ${ip} | Body: ${body}`);
            return res.status(403).json({ error: "Forbidden: Malicious content detected" });
        }
    }

    // 4. Check body for SQLi
    for (const pattern of SQLI_PATTERNS) {
        if (pattern.test(body)) {
            console.warn(`[WAF] Blocked SQLi attempt from IP: ${ip} | Body: ${body}`);
            return res.status(403).json({ error: "Forbidden: Malicious content detected" });
        }
    }

    // 5. Block oversized requests (basic DoS protection)
    const contentLength = parseInt(req.headers["content-length"] || 0);
    if (contentLength > 1024 * 100) { // 100KB limit
        console.warn(`[WAF] Blocked oversized request from IP: ${ip} | Size: ${contentLength}`);
        return res.status(413).json({ error: "Request too large" });
    }

    next();
};

module.exports = { waf };