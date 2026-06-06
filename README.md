# NodeGoat Security Assessment
**Internship Task 2 | Weeks 4–6 | Talbiya Asif**

A security-hardened fork of the OWASP NodeGoat application, demonstrating implementation of advanced security measures across three weeks of a cybersecurity internship.

---

## Week 4: API Security & Security Headers

### What Was Implemented
- **Rate Limiting** — `express-rate-limit` with 100 req/15min globally, 10 req/15min on auth endpoints
- **CORS** — Restricted to whitelisted origins only
- **Security Headers** — Helmet with full CSP, HSTS, X-Frame-Options, noSniff
- **JWT Authentication** — Token-based API protection (1hr expiry)
- **API Key Authentication** — For service-to-service routes

### Files Changed
- `middleware/security.js` — New security middleware
- `server.js` — Applied all middleware
- `.env` — API_KEY and JWT_SECRET

### Testing
```bash
# Check security headers
curl -I http://localhost:4000

# Trigger rate limiter (run 11 times)
for i in {1..11}; do curl -X POST http://localhost:4000/login; done
```

---

## Week 5: Ethical Hacking & Vulnerability Fixes

### What Was Found & Fixed
- **NoSQL Injection** — Login query sanitized with `$eq` + `String()` casting
- **Broken bcrypt Comparison** — Fixed argument order in `comparePassword()`
- **CSRF Protection** — `csurf` middleware added to all form endpoints
- **DB Seed Script** — Updated for MongoDB v4 API compatibility

### Files Changed
- `app/data/user-dao.js` — NoSQL injection fix, bcrypt fix
- `server.js` — CSRF middleware
- `artifacts/db-reset.js` — MongoDB v4 compatible seed script

### SQLMap Results
SQLMap was run against the login endpoint. No SQL injection found (MongoDB is NoSQL). Rate limiter triggered **6,143 HTTP 429 responses** blocking the automated scan.

### Reports
- See `ETHICAL_HACKING_REPORT.md` for full findings

---

## Week 6: Security Audits & Hardening

### Audits Performed
- **OWASP ZAP** — 22 alerts found, all medium/high fixed
- **Nikto** — Run from Kali Linux VM, 4 issues found and fixed

### What Was Fixed
- Cookie flags: `httpOnly`, `sameSite: strict`
- Server version hidden: `x-powered-by` disabled
- CSP expanded with fallback directives
- `Permissions-Policy` header added

### Files Changed
- `server.js` — Cookie config, Permissions-Policy header
- `middleware/security.js` — Enhanced CSP directives

### Reports
- See `FINAL_SECURITY_AUDIT_REPORT.md` for full audit results

---

## Bonus Challenges (Completed)

| Challenge | Implementation | File |
|---|---|---|
| Zero Trust Security | Every request re-verified via JWT, no implicit trust | `middleware/zerotrust.js` |
| Web Application Firewall | WAF middleware blocking malicious payloads | `middleware/waf.js` |
| Social Engineering Simulation | Phishing awareness training & findings documented | `SOCIAL_ENGINEERING_REPORT.md` |

---

## Installation & Setup

```bash
# Clone the repository
git clone https://github.com/Talbiya-Asif/NodeGoat-Security-Assessment.git
cd NodeGoat-Security-Assessment

# Install dependencies
npm install
npm install cors

# Create .env file
echo "API_KEY=your-secure-random-key" >> .env
echo "JWT_SECRET=your-jwt-secret" >> .env

# Seed the database
node artifacts/db-reset.js

# Start the server
npm start
```

App runs at: **http://localhost:4000**

### Default Accounts
| Username | Password | Role |
|---|---|---|
| admin | Admin_123 | Administrator |
| user1 | User1_123 | Regular User |
| user2 | User2_123 | Regular User |

---

## Security Architecture

```
Request
  │
  ├── Helmet (CSP, HSTS, X-Frame-Options, noSniff)
  ├── CORS (whitelist check)
  ├── Rate Limiter (100 req/15min)
  │
  ├── /login → Auth Rate Limiter (10 req/15min)
  │
  ├── Session (httpOnly, sameSite: strict)
  ├── CSRF Token Validation
  │
  ├── JWT Auth (protected API routes)
  └── API Key Auth (admin routes)
```

---

## OWASP Top 10 Coverage

| Risk | Mitigation |
|---|---|
| A01 Broken Access Control | JWT, API Key, CSRF |
| A02 Cryptographic Failures | HSTS, bcrypt |
| A03 Injection | NoSQL injection fix, CSP |
| A05 Security Misconfiguration | Helmet, CORS, cookies |
| A07 Auth Failures | Rate limiting, bcrypt fix |

---
---

## Deployment Note
Deployment to a public server was intentionally omitted — NodeGoat is a deliberately vulnerable application and exposing it publicly would create real security risks. Secure deployment practices including Docker image scanning, HTTPS configuration, and dependency auditing are fully documented in `FINAL_SECURITY_AUDIT_REPORT.md` Section 7.

---

## License
Apache 2.0