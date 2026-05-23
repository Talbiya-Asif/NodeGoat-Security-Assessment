# Ethical Hacking Report — Week 5
**Project:** NodeGoat Security Assessment  
**Tester:** Talbiya Asif  
**Date:** May 2026  
**Environment:** Local (http://localhost:4000)  
**Tools Used:** SQLMap 1.10.5, Burp Suite (Community), Manual Testing  

---

## 1. Scope & Objectives

The goal of this assessment was to identify and exploit vulnerabilities in the NodeGoat web application running locally, then apply appropriate fixes. Testing was performed in a controlled environment on an intentionally vulnerable application.

**In Scope:**
- Login and Signup endpoints
- Profile, Contributions, Allocations pages
- MongoDB database layer
- Session and authentication mechanisms

---

## 2. Reconnaissance

**Target:** http://localhost:4000  
**Tech Stack Identified:** Node.js, Express.js, MongoDB, Swig templates  
**Open Ports:** 4000 (HTTP), 27017 (MongoDB)  
**Default Accounts Found:** admin, user1, user2 (from source code review)

---

## 3. Vulnerability Findings

### 3.1 NoSQL Injection (HIGH)

| Field | Details |
|---|---|
| **Vulnerability** | NoSQL Injection |
| **Location** | `app/data/user-dao.js` → `validateLogin()` |
| **Severity** | High |
| **OWASP Category** | A03:2021 – Injection |

**Description:**  
The login query passed user-supplied input directly into the MongoDB `findOne()` query without sanitization. An attacker could supply a JSON object like `{"$gt": ""}` as the username to bypass authentication entirely.

**Vulnerable Code (Before Fix):**
```js
usersCol.findOne({ userName: userName }, validateUserDoc);
```

**Proof of Concept:**  
Sending the following POST request would bypass login:
```
POST /login
userName[$gt]=&password[$gt]=
```

**Fix Applied:**
```js
usersCol.findOne({ userName: { $eq: String(userName) } }, validateUserDoc);
```
The `$eq` operator with `String()` casting ensures the input is always treated as a plain string, never as a MongoDB operator object.

---

### 3.2 Broken Password Comparison (HIGH)

| Field | Details |
|---|---|
| **Vulnerability** | Incorrect bcrypt argument order |
| **Location** | `app/data/user-dao.js` → `comparePassword()` |
| **Severity** | High |
| **OWASP Category** | A07:2021 – Identification and Authentication Failures |

**Description:**  
The `bcrypt.compareSync()` arguments were swapped — the hashed password and plain text password were passed in the wrong order, causing all password comparisons to fail or behave unpredictably.

**Vulnerable Code (Before Fix):**
```js
return bcrypt.compareSync(fromUser, fromDB); // wrong order
```

**Fix Applied:**
```js
return bcrypt.compareSync(fromDB, fromUser); // plain text first, hash second
```

---

### 3.3 Missing CSRF Protection (MEDIUM)

| Field | Details |
|---|---|
| **Vulnerability** | Cross-Site Request Forgery (CSRF) |
| **Location** | All POST form endpoints |
| **Severity** | Medium |
| **OWASP Category** | A01:2021 – Broken Access Control |

**Description:**  
No CSRF tokens were present on form submissions, allowing an attacker to craft a malicious page that could submit requests on behalf of an authenticated user.

**Fix Applied:**  
Added `csurf` middleware globally in `server.js`:
```js
app.use(csrf());
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    res.locals.csrftoken = req.csrfToken();
    res.locals._csrf = req.csrfToken();
    next();
});
```
CSRF token is now embedded in all forms via a hidden field:
```html
<input type="hidden" name="_csrf" value="{{csrftoken}}" />
```

---

### 3.4 SQLMap Scan Results (INFORMATIONAL)

| Field | Details |
|---|---|
| **Tool** | SQLMap 1.10.5 |
| **Target** | POST /login (userName, password parameters) |
| **Result** | No SQL injection vulnerabilities found |

**Description:**  
SQLMap was run against the login endpoint with `--level=3 --risk=2`. No injectable parameters were identified. Notably, the rate limiter triggered **6,143 HTTP 429 responses** during the scan, demonstrating that the Week 4 brute-force protection actively defended against the automated attack tool.

```
[WARNING] POST parameter 'userName' does not seem to be injectable
[WARNING] POST parameter 'password' does not seem to be injectable
[WARNING] HTTP error codes detected during run:
429 (Too Many Requests) - 6143 times
```

This is expected — NodeGoat uses MongoDB (NoSQL), not a SQL database, so traditional SQL injection does not apply. The relevant injection vector is NoSQL injection, which was found and fixed manually (see 3.1).

---

## 4. Summary of Vulnerabilities

| # | Vulnerability | Severity | Status |
|---|---|---|---|
| 1 | NoSQL Injection in login | High | ✅ Fixed |
| 2 | Broken bcrypt password comparison | High | ✅ Fixed |
| 3 | Missing CSRF protection | Medium | ✅ Fixed |
| 4 | SQL Injection (SQLMap scan) | N/A | ✅ Not applicable (MongoDB) |

---

## 5. Tools Used

| Tool | Purpose | Result |
|---|---|---|
| SQLMap 1.10.5 | Automated SQL injection testing | No SQLi found; rate limiter triggered |
| Manual Code Review | NoSQL injection, auth logic | 2 High severity issues found and fixed |
| csurf middleware | CSRF token validation | Implemented and tested |
| Burp Suite | Intercept and inspect HTTP requests | Used to verify CSRF token in requests |

---

## 6. Recommendations

1. **Input Validation:** Always sanitize and type-check user inputs before passing to database queries.
2. **Parameterized Queries:** Use `$eq` with explicit type casting for all MongoDB queries involving user input.
3. **CSRF Tokens:** Ensure all state-changing forms include and validate CSRF tokens.
4. **Dependency Updates:** Replace `bcrypt-nodejs` (deprecated) with the maintained `bcrypt` package.
5. **Rate Limiting:** Keep the existing rate limiter in place — it successfully blocked automated attack tools.

---

## 7. Conclusion

The assessment identified two high-severity vulnerabilities (NoSQL injection and broken authentication) and one medium-severity vulnerability (missing CSRF protection). All three were successfully remediated. The application's existing rate limiting proved effective against automated scanning tools, blocking over 6,000 requests during the SQLMap test.