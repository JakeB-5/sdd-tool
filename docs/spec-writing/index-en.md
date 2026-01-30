# Specification Writing Guide

Learn how to write clear, effective specifications using SDD Tool.

## Overview

Writing effective specifications is core to Spec-Driven Development. This guide covers best practices, formats, and conventions.

## Key Principles

1. **Clarity** - Specifications must be unambiguous
2. **Completeness** - Cover all scenarios and edge cases
3. **Consistency** - Follow conventions throughout
4. **Testability** - Specifications should be verifiable
5. **Maintainability** - Specs should be easy to update

## Specification Structure

Every specification file has three main parts:

### 1. Metadata (YAML Front Matter)

```yaml
---
id: user-authentication
title: "User Authentication"
status: draft
created: 2025-01-30
updated: 2025-01-31
version: 1.0.0
constitution_version: 1.0.0
domain: auth
---
```

**Required Fields:**
- `id` - Unique identifier (kebab-case)
- `title` - Human-readable title
- `status` - One of: draft, active, deprecated
- `created` - Creation date (YYYY-MM-DD)
- `constitution_version` - Project constitution version

**Optional Fields:**
- `updated` - Last update date
- `version` - Specification version
- `domain` - Domain this spec belongs to
- `related` - Related specification IDs
- `tags` - Category tags

### 2. Overview Section

```markdown
# User Authentication

> A concise description of what this spec covers

## Purpose

Explain why this feature is needed and its importance.

## Scope

Define what is and isn't covered by this spec.

### What's Included
- Email/password authentication
- Session management
- Token-based API access

### What's Excluded
- Social login (see social-auth spec)
- Multi-factor authentication
```

### 3. Requirements Section

Define specific requirements using RFC 2119 keywords.

```markdown
## Requirements

### REQ-001: Email/Password Login

The system SHALL support user login using email and password.

- Email SHALL be validated as RFC 5322 compliant
- Password SHALL be at least 8 characters
- Failed login attempts SHOULD be rate-limited
```

## RFC 2119 Keywords

Use standardized keywords to specify requirement levels:

### SHALL / MUST (Absolute Requirement)

Use for critical requirements that are non-negotiable.

```markdown
- The system SHALL authenticate users via email/password
- The API SHALL return HTTP 401 for invalid credentials
- All data SHALL be encrypted in transit
```

**Implications:**
- Implementation MUST satisfy this requirement
- Tests MUST verify compliance
- Violations are bugs

### SHOULD (Recommended)

Use for important but flexible requirements.

```markdown
- The system SHOULD provide password recovery
- The response SHOULD include helpful error messages
- The system SHOULD log failed authentication attempts
```

**Implications:**
- Implementation SHOULD satisfy this requirement
- May be skipped with documented justification
- Consider requirements carefully before skipping

### MAY (Optional)

Use for features that are truly optional.

```markdown
- The system MAY support single sign-on (SSO)
- The UI MAY include biometric authentication
- The API MAY cache user profile data
```

**Implications:**
- Implementation may choose to include or exclude
- No requirement to test for compliance

### SHALL NOT (Forbidden)

Use to explicitly forbid certain behaviors.

```markdown
- The system SHALL NOT store passwords in plaintext
- The API SHALL NOT expose user IDs in error messages
- The client SHALL NOT store sensitive data locally
```

**Implications:**
- Implementation MUST NOT do this
- Tests MUST verify non-compliance
- Violations are security issues

## Writing Scenarios (GIVEN-WHEN-THEN)

Scenarios provide concrete examples of how features work:

### Basic Structure

```markdown
### Scenario 1: Successful Login

- **GIVEN** a user with email "alice@example.com" exists in the system
- **WHEN** they submit a login form with correct password
- **THEN** they receive a valid JWT token
- **AND** their last login time is updated
```

### Anatomy of a Scenario

**GIVEN** - Initial context and preconditions
- What state must exist before the action
- What data or configuration is in place

**WHEN** - The action or trigger
- What the user or system does
- What event occurs

**THEN** - Expected outcomes
- What should happen as a result
- What state or data changes

**AND/OR** - Additional outcomes or conditions
- Multiple conditions in one step
- Related outcomes

### Good Scenario Examples

**Login Success:**
```markdown
### Scenario: Valid Credentials

- **GIVEN** a registered user with email "user@example.com"
- **AND** they know their correct password
- **WHEN** they submit the login form
- **THEN** they receive an authentication token
- **AND** they are redirected to the dashboard
```

**Login Failure:**
```markdown
### Scenario: Invalid Password

- **GIVEN** a registered user with email "user@example.com"
- **WHEN** they submit the login form with wrong password
- **THEN** they see an error message "Invalid credentials"
- **AND** the login attempt is logged
- **AND** their account is not affected
```

**Edge Cases:**
```markdown
### Scenario: Non-existent User

- **GIVEN** no user exists with email "unknown@example.com"
- **WHEN** someone attempts to log in with that email
- **THEN** they see a generic error message
- **AND** no information about user existence is revealed
```

### Best Practices for Scenarios

1. **Be Specific** - Use concrete values, not abstractions
   - Good: "email: alice@example.com"
   - Bad: "a valid email"

2. **One Outcome Per THEN** - Keep scenarios focused
   - Good: One scenario per success/failure path
   - Bad: Multiple different outcomes in one scenario

3. **Cover Happy and Sad Paths**
   - Happy path: Normal successful flow
   - Sad paths: All failure modes
   - Edge cases: Boundary conditions

4. **Make Scenarios Testable**
   - Each scenario should have a corresponding test
   - Use clear, verifiable assertions

5. **Use Consistent Language**
   - Same terminology throughout
   - Define terms in glossary if needed

## Complete Specification Example

```markdown
---
id: user-authentication
title: "User Authentication System"
status: active
created: 2025-01-30
version: 1.0.0
constitution_version: 1.0.0
domain: auth
tags:
  - security
  - core
---

# User Authentication System

> Provides secure user authentication using email/password and JWT tokens

## Purpose

Enable secure user identification and session management while protecting user credentials.

## Scope

### What's Included
- Email/password authentication
- JWT token generation and validation
- Session management
- Password reset functionality

### What's Excluded
- Multi-factor authentication
- Social login (future feature)
- Account recovery procedures

## Core Requirements

### REQ-001: Email/Password Authentication

The system SHALL support secure authentication using email and password.

#### Functional Requirements

- User SHALL provide email and password
- System SHALL validate email format (RFC 5322)
- System SHALL validate password meets minimum requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one number
  - At least one special character

#### Security Requirements

- Passwords SHALL be hashed using bcrypt (minimum 10 rounds)
- Passwords SHALL NOT be stored in plaintext
- Passwords SHALL NOT be returned in any API response
- Failed attempts SHALL be logged for security audit

#### Performance Requirements

- Login response time SHOULD be under 500ms
- The system SHOULD rate-limit failed attempts (5 attempts per 15 minutes)

### REQ-002: JWT Token Management

The system SHALL use JWT (JSON Web Tokens) for API authentication.

- Token SHALL expire after 24 hours
- Token MAY be refreshed using a refresh token
- Refresh token SHALL have 30-day expiration
- Expired tokens SHALL be rejected with HTTP 401

### REQ-003: Password Reset

The system SHOULD provide password reset capability.

- User SHALL request password reset via email
- System SHOULD send reset link (valid for 1 hour)
- User SHALL be able to set new password via link
- Old password SHALL NOT be required for reset

## Scenarios

### Successful Login Flow

#### Scenario 1: User Logs In with Valid Credentials

- **GIVEN** a user "alice@example.com" is registered with password "SecurePass123!"
- **WHEN** alice submits login form with email and correct password
- **THEN** the system validates the credentials
- **AND** the system generates a JWT token
- **AND** alice receives the token with 24-hour expiration
- **AND** alice can use the token for API requests

#### Scenario 2: Login Redirects to Dashboard

- **GIVEN** alice has successfully logged in
- **WHEN** the login form processes the response
- **THEN** alice is redirected to the dashboard
- **AND** the token is stored securely in the client

### Login Failure Scenarios

#### Scenario 3: Invalid Password

- **GIVEN** a user "bob@example.com" is registered
- **WHEN** bob submits login form with wrong password
- **THEN** the system returns error "Invalid credentials"
- **AND** the login attempt is logged
- **AND** bob is NOT logged in

#### Scenario 4: Account Lockout After Failed Attempts

- **GIVEN** a user has failed login 5 times in 15 minutes
- **WHEN** they attempt to log in again
- **THEN** the system returns error "Account temporarily locked"
- **AND** the account is locked for 15 minutes
- **AND** an alert email is sent to the user

#### Scenario 5: Non-existent User

- **GIVEN** no user exists with email "unknown@example.com"
- **WHEN** someone attempts login with that email
- **THEN** the system returns generic error "Invalid credentials"
- **AND** no information is leaked about user existence

### Token Management

#### Scenario 6: Token Expiration

- **GIVEN** a user has a token that expired 1 hour ago
- **WHEN** they attempt to make an API request
- **THEN** the API returns HTTP 401 Unauthorized
- **AND** the client should redirect to login

#### Scenario 7: Token Refresh

- **GIVEN** a user has a valid refresh token
- **WHEN** their access token expires
- **THEN** they can use refresh token to get new access token
- **AND** the new token is valid for another 24 hours

### Password Reset

#### Scenario 8: Successful Password Reset

- **GIVEN** charlie has forgotten their password
- **WHEN** charlie requests password reset for "charlie@example.com"
- **THEN** charlie receives an email with reset link
- **AND** the link is valid for 1 hour
- **WHEN** charlie opens the link and sets new password "NewPass456!"
- **THEN** the password is updated in the system
- **AND** charlie can log in with new password

## Glossary

| Term | Definition |
|------|-----------|
| JWT | JSON Web Token - stateless authentication token |
| Bearer Token | Authorization header containing JWT |
| Refresh Token | Long-lived token used to obtain new access tokens |
| bcrypt | Cryptographic algorithm for password hashing |

## Related Specifications

- social-auth - Social login implementation
- mfa - Multi-factor authentication
- password-policy - Organization password requirements

## Notes

- Security review scheduled for Q2 2025
- Consider bcrypt performance on large-scale deployments
- Plan for token revocation mechanism in future version
```

## Writing Tips

### 1. Use Clear, Precise Language

**Good:**
- "The system SHALL validate email format according to RFC 5322"

**Avoid:**
- "The system should check if the email looks okay"
- "The email must be valid or something"

### 2. Be Specific About Constraints

**Good:**
```markdown
- Password SHALL be 8-64 characters
- Password SHALL contain at least one uppercase letter
- Password SHALL contain at least one number
```

**Avoid:**
```markdown
- Password must be strong
- Password should be secure
```

### 3. Separate Concerns into Different Requirements

**Good:**
```markdown
### REQ-001: Email Validation
- Emails SHALL be RFC 5322 compliant

### REQ-002: Password Validation
- Passwords SHALL be minimum 8 characters
```

**Avoid:**
```markdown
### REQ-001: User Credentials
- Emails should be valid and passwords should be strong
```

### 4. Include Negative Tests

**Good:**
```markdown
### Scenario: Rejected Invalid Password
- **GIVEN** a user with valid email
- **WHEN** they submit invalid password
- **THEN** login is rejected
```

### 5. Make Scenarios Independent

Each scenario should be runnable independently without depending on other scenarios.

**Good:** Each scenario fully describes its preconditions
**Avoid:** "After scenario 1, the user should..."

## Common Pitfalls

### Pitfall 1: Using Ambiguous Terms

**Problem:** "The system SHOULD be fast"
**Solution:** "Response time SHOULD be under 500ms"

### Pitfall 2: Mixing Levels of Abstraction

**Problem:** "The system SHALL authenticate users and show a nice UI"
**Solution:** Separate into authentication and UI specs

### Pitfall 3: Over-Specifying Implementation

**Problem:** "The system SHALL use bcrypt with 10 rounds"
**Better:** "Passwords SHALL be securely hashed using industry-standard algorithms"

### Pitfall 4: Neglecting Edge Cases

**Problem:** Only happy path scenarios
**Solution:** Include edge cases, error conditions, boundary values

### Pitfall 5: Outdated Specifications

**Problem:** Specs not updated when requirements change
**Solution:** Update specs before implementation changes, not after

## Reviewing Specifications

Before implementing, review specs for:

1. **Clarity** - Can team members understand requirements?
2. **Completeness** - Are all scenarios covered?
3. **Consistency** - Is terminology consistent?
4. **Feasibility** - Can requirements be implemented?
5. **Testability** - Can requirements be verified?
6. **Alignment** - Do specs match constitution?

## Specification Lifecycle

```
draft
  ↓
(review & feedback)
  ↓
active (being implemented)
  ↓
(updates during development)
  ↓
completed (implementation done)
  ↓
(later changes)
  ↓
deprecated (replaced by newer version)
```

## Next Steps

- [RFC 2119 Keywords Deep Dive](./rfc2119.md)
- [GIVEN-WHEN-THEN Best Practices](./given-when-then.md)
- [Requirements Writing](./requirements.md)
- [Writing Constitution](./constitution.md)

---

Ready to write specifications? Start with the [Getting Started Guide](../guide/getting-started-en.md).
