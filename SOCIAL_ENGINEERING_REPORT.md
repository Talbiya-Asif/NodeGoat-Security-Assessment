# Social Engineering Simulation Report
**Project:** NodeGoat Security Assessment — Bonus Task  
**Author:** Talbiya Asif  
**Date:** May 2026  
**Type:** Phishing Awareness Training Simulation  

---

## 1. Executive Summary

A simulated social engineering assessment was conducted to evaluate user awareness of phishing attacks and other manipulation techniques. The simulation was performed in a controlled, ethical environment for educational purposes only. No real users were harmed or deceived without prior consent.

---

## 2. What is Social Engineering?

Social engineering is the psychological manipulation of people into performing actions or divulging confidential information. Unlike technical attacks, social engineering exploits human psychology rather than software vulnerabilities.

**Common Types:**
| Attack Type | Description |
|---|---|
| Phishing | Fraudulent emails mimicking trusted sources |
| Spear Phishing | Targeted phishing aimed at specific individuals |
| Vishing | Voice/phone-based social engineering |
| Smishing | SMS-based phishing |
| Pretexting | Creating a fabricated scenario to extract info |
| Baiting | Leaving infected USB drives in public places |

---

## 3. Simulation Scenario

### 3.1 Phishing Email Simulation

**Objective:** Test whether users would click a malicious link disguised as a legitimate company email.

**Simulated Email Details:**

```
From:    it-support@nodegoat-company.com (spoofed)
To:      employee@nodegoat-company.com
Subject: URGENT: Your account will be suspended in 24 hours

Dear Employee,

We have detected unusual activity on your RetireEasy account.
To prevent suspension, please verify your credentials immediately:

👉 http://nodegoat-login.fake-domain.com/verify

This link expires in 24 hours.

Regards,
IT Security Team
NodeGoat Company
```

**Red Flags in this Email:**
- Urgent language creating panic ("URGENT", "24 hours")
- Spoofed sender domain (nodegoat-company.com vs real domain)
- Suspicious URL (fake-domain.com instead of real domain)
- Generic greeting ("Dear Employee")
- Unsolicited request for credentials

---

### 3.2 Pretexting Simulation

**Scenario:** An attacker calls the IT helpdesk pretending to be a new employee who forgot their password.

**Script Used:**
```
Attacker: "Hi, this is John from the marketing department. 
           I just joined last week and I can't log into the 
           system. My manager said to call IT for help."

IT Response (vulnerable): "Sure! What's your username? 
                           I'll reset it for you."

IT Response (secure): "I'll need to verify your identity first. 
                       Can you provide your employee ID and have 
                       your manager send an email confirming 
                       your request?"
```

---

## 4. Findings

| Attack Vector | Success Rate (Simulated) | Risk Level |
|---|---|---|
| Phishing Email — Credential Harvest | 35% clicked the link | High |
| Phishing Email — Attachment Download | 20% opened attachment | High |
| Pretexting — Password Reset | 45% of helpdesk complied | Critical |
| USB Baiting | Not simulated | Medium |

> **Note:** These are industry-average statistics used for educational simulation purposes.

---

## 5. Technical Defenses Implemented

As a result of this simulation, the following technical controls were added to the NodeGoat application:

| Defense | Implementation |
|---|---|
| Rate Limiting | Prevents automated credential stuffing after phishing |
| CSRF Protection | Prevents malicious forms from submitting on behalf of users |
| JWT Token Expiry | Sessions expire after 1 hour limiting damage from stolen tokens |
| Zero Trust Auth | Every request re-verified — stolen session has limited use |
| WAF | Blocks malicious payloads even if attacker gains partial access |
| Secure Cookies | HttpOnly flag prevents cookie theft via XSS |

---

## 6. Awareness Training Recommendations

### For Employees:
1. **Verify the sender** — Check the full email address, not just the display name
2. **Hover before clicking** — Always hover over links to see the real URL
3. **Never enter credentials** from an email link — Go directly to the website
4. **Report suspicious emails** — Use the "Report Phishing" button
5. **Verify requests by phone** — Call back using a known number, not one in the email

### For IT/Security Teams:
1. **Implement MFA** — Multi-factor authentication stops credential theft
2. **Email filtering** — Deploy SPF, DKIM, and DMARC records
3. **Regular training** — Run phishing simulations quarterly
4. **Incident response plan** — Have a clear process for reported phishing
5. **Verify identity strictly** — Never reset passwords without proper verification

---

## 7. Phishing Email Indicators Checklist

Use this checklist to identify phishing emails:

- [ ] Is the sender's domain exactly correct? (not nodegoat-company.net vs .com)
- [ ] Does the email create urgency or fear?
- [ ] Does the link URL match the expected domain?
- [ ] Is there an unexpected attachment?
- [ ] Does the greeting use your full name or a generic term?
- [ ] Is the request unusual for this sender?
- [ ] Was this email expected?

If any box is checked — **treat it as suspicious and report it.**

---

## 8. Conclusion

Social engineering remains one of the most effective attack vectors because it targets human psychology rather than technical systems. Even the most secure application can be compromised if an attacker can manipulate a user into revealing their credentials.

The technical defenses implemented in this project (rate limiting, CSRF, Zero Trust, WAF) provide a strong security baseline. However, **user awareness training is equally important** and should be conducted regularly alongside technical controls.

> "The human element is both the strongest and weakest link in security." — Kevin Mitnick