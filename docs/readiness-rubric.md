# FitWizard Deployment Readiness Rubric

## Overview
This rubric defines measurable criteria for determining if FitWizard is ready for production deployment. Score each criterion 0-2, calculate percentage, and compare against release threshold.

**Release Threshold:** ≥70% overall score

---

## Scoring Guide
| Score | Meaning |
|-------|---------|
| 0 | Not implemented / Major gaps |
| 1 | Partially implemented / Minor gaps |
| 2 | Fully implemented / No gaps |

---

## Categories & Criteria

### 1. Security & Privacy (Max: 10 points)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1.1 | No exposed secrets in codebase | /2 | |
| 1.2 | Dependencies pass `npm audit` (no high/critical) | /2 | |
| 1.3 | User input validated (Zod schemas) | /2 | |
| 1.4 | PII classified and encrypted at rest (if applicable) | /2 | |
| 1.5 | Auth tokens stored securely (httpOnly cookies) | /2 | |

---

### 2. Reliability (Max: 10 points)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 2.1 | Error boundary catches runtime errors | /2 | |
| 2.2 | API calls have retry logic | /2 | |
| 2.3 | Graceful degradation when backend unavailable | /2 | |
| 2.4 | No unhandled promise rejections | /2 | |
| 2.5 | Loading states for async operations | /2 | |

---

### 3. Performance (Max: 8 points)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 3.1 | Plan generation < 100ms | /2 | |
| 3.2 | Initial page load < 3s (LCP) | /2 | |
| 3.3 | No layout shift (CLS < 0.1) | /2 | |
| 3.4 | Bundle size < 500KB gzipped | /2 | |

---

### 4. Observability (Max: 8 points)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 4.1 | Client errors logged to external service | /2 | |
| 4.2 | Backend requests logged with request IDs | /2 | |
| 4.3 | Key metrics tracked (wizard completion, errors) | /2 | |
| 4.4 | Alerts configured for error spikes | /2 | |

---

### 5. UX & Accessibility (Max: 10 points)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 5.1 | Keyboard navigation works throughout | /2 | |
| 5.2 | Screen reader compatible (ARIA labels) | /2 | |
| 5.3 | Touch targets ≥ 44px | /2 | |
| 5.4 | Color contrast meets WCAG AA | /2 | |
| 5.5 | Focus management on step changes | /2 | |

---

### 6. Data Quality (Max: 6 points)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 6.1 | Exercise database reviewed for accuracy | /2 | |
| 6.2 | Plan schema versioned with migrations | /2 | |
| 6.3 | Validation errors surfaced to users | /2 | |

---

### 7. Compliance (Max: 8 points)

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 7.1 | Privacy policy published | /2 | |
| 7.2 | User consent captured for data storage | /2 | |
| 7.3 | Data retention policy implemented | /2 | |
| 7.4 | Export/delete user data on request | /2 | |

---

## Score Calculation

| Category | Max Points | Your Score |
|----------|------------|------------|
| Security & Privacy | 10 | |
| Reliability | 10 | |
| Performance | 8 | |
| Observability | 8 | |
| UX & Accessibility | 10 | |
| Data Quality | 6 | |
| Compliance | 8 | |
| **TOTAL** | **60** | |

**Percentage:** (Your Score / 60) × 100 = ___%

---

## Release Decision

| Score | Decision |
|-------|----------|
| ≥70% (42+ points) | ✅ Ready for production |
| 50-69% (30-41 points) | ⚠️ Conditional release (document gaps) |
| <50% (<30 points) | ❌ Not ready - address critical gaps |

---

## Review Schedule
- **Before major releases:** Full rubric review
- **Quarterly:** Update criteria as product evolves
- **After incidents:** Add relevant criteria

---

## Current Assessment

### Date: ___________
### Assessor: ___________
### Total Score: ___/60 (___%)
### Decision: ___________

#### Critical Gaps (score 0):
1. 
2. 

#### Action Items:
1. 
2. 
