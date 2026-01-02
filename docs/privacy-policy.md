# FitWizard Data Privacy & Retention Policy

## Overview
This document defines how FitWizard handles user data, including collection, storage, retention, and deletion practices.

---

## 1. Data Classification

### 1.1 Non-PII (Publicly Shareable)
- Workout plan structure (exercises, sets, reps)
- Goal preferences (strength, hypertrophy, general)
- Equipment selections

### 1.2 Sensitive Fitness Data (Protected)
- Target muscle configurations
- Physical constraints/limitations
- Injury information
- Training history patterns

### 1.3 PII (Personally Identifiable - Future)
- User accounts (email, name)
- Client profiles in trainer mode
- Assigned workout schedules

---

## 2. Data Collection

### 2.1 What We Collect
- Wizard selections (goal, equipment, muscles, constraints, schedule)
- Generated workout plans
- User preferences (theme, language)
- Anonymous analytics events (wizard funnel, plan generation)

### 2.2 What We Don't Collect
- Health records
- Medical diagnoses
- Biometric data
- Location data

---

## 3. Storage

### 3.1 Client-Side (Current)
| Data | Storage | Encrypted |
|------|---------|-----------|
| Plans | localStorage | No |
| Preferences | localStorage | No |
| Session | sessionStorage | No |

### 3.2 Server-Side (Future)
| Data | Storage | Encrypted |
|------|---------|-----------|
| Plans | SQLite/PostgreSQL | At-rest optional |
| User accounts | Database | Passwords hashed |

---

## 4. Retention Periods

| Data Type | Retention | Justification |
|-----------|-----------|---------------|
| Active plans | Indefinite (user-controlled) | Core functionality |
| Plan history | 20 plans max | UX limit |
| Analytics events | 90 days | Funnel analysis |
| Deleted plans | Immediate purge | Privacy |

---

## 5. User Rights (GDPR/CCPA Aligned)

### 5.1 Access
Users can view all their stored data in the app.

### 5.2 Export
- PDF export available for plans
- JSON export planned for full data

### 5.3 Deletion
- "Clear All Data" option clears localStorage
- Individual plan deletion available
- No data retained after deletion

### 5.4 Portability
Plans can be exported as PDF for use elsewhere.

---

## 6. Consent

### 6.1 Current State
- No explicit consent required (no server transmission)
- localStorage usage implied by app usage

### 6.2 Future Requirements (with backend)
- Cookie banner for analytics
- Terms of Service on account creation
- Privacy policy link in footer

---

## 7. Third-Party Data Sharing

**Current:** None. All data stays on device.

**Planned (with opt-in):**
- Anonymous analytics to service provider
- Error tracking to monitoring service

---

## 8. Security Measures

| Measure | Status |
|---------|--------|
| HTTPS | Required in production |
| XSS Protection | React escaping + CSP |
| localStorage encryption | Not implemented |
| API authentication | Planned |
| Rate limiting | Planned |

---

## 9. Data Breach Response

1. Identify affected data scope
2. Notify users within 72 hours (if PII affected)
3. Rotate any compromised credentials
4. Document incident and remediation

---

## 10. Contact

For privacy inquiries: [privacy@fitwizard.example.com]

---

*Last Updated: {TODAY}*
*Version: 1.0*
