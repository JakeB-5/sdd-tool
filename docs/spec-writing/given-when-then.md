# GIVEN-WHEN-THEN Scenarios Guide

Master the art of writing clear, testable scenarios using GIVEN-WHEN-THEN format.

## What are GIVEN-WHEN-THEN Scenarios?

GIVEN-WHEN-THEN is a format for writing test scenarios that express requirements as examples. Also known as **Gherkin** or **BDD (Behavior-Driven Development)** style.

**Format:**
```
GIVEN [initial context]
WHEN [action/event]
THEN [expected outcome]
```

**Why it works:**
- Easy to understand for all stakeholders
- Bridge between business and technical teams
- Directly translatable to automated tests
- Clear acceptance criteria

## Anatomy of a Scenario

### GIVEN: Setup and Context

**What it means:** The initial state and preconditions

**Describes:**
- What data exists
- What configuration is in place
- What user state or role applies
- Prerequisites for the action

**Examples:**

```markdown
- **GIVEN** a user "alice@example.com" is registered in the system
- **GIVEN** alice is logged in to the application
- **GIVEN** alice has an active subscription
- **GIVEN** the database contains 100 product records
- **GIVEN** the current time is 3:00 PM on a Friday
```

**Best practices:**
- Be specific with concrete values
- Use names and identifiers, not abstractions
- Include necessary setup state
- Keep it concise but complete

### WHEN: Action or Trigger

**What it means:** What happens to trigger the scenario

**Describes:**
- What the user does
- What action is triggered
- What event occurs
- What external stimulus applies

**Examples:**

```markdown
- **WHEN** alice clicks the "Login" button
- **WHEN** alice submits the form with valid credentials
- **WHEN** the system processes a new order
- **WHEN** a scheduled task runs at midnight
- **WHEN** the API receives a GET request
```

**Best practices:**
- One primary action per scenario
- Describe the action clearly
- Use user-centric language
- Avoid implementation details

### THEN: Expected Outcome

**What it means:** What should happen as a result

**Describes:**
- What state changes
- What output is produced
- What the user sees
- What data is modified

**Examples:**

```markdown
- **THEN** alice is logged into the system
- **THEN** alice sees the dashboard page
- **THEN** an order confirmation email is sent
- **THEN** the order status changes to "Processing"
- **THEN** the API returns HTTP 200 with order details
```

**Best practices:**
- Describe observable outcomes
- One main outcome per THEN (use AND for related outcomes)
- Be specific about state changes
- Make it testable

### AND/OR: Additional Details

**Purpose:** Chain multiple related conditions or outcomes

**Examples:**

```markdown
### Scenario: Multi-step Login

- **GIVEN** a registered user exists
- **AND** the user's account is active
- **WHEN** the user enters valid email and password
- **THEN** the user receives a JWT token
- **AND** the user is redirected to the dashboard
- **AND** a login event is logged
```

**Best practices:**
- Use AND for additional related items
- Use OR for alternative conditions
- Keep the main GIVEN-WHEN-THEN clear
- Don't overuse AND (limit to 2-3 per section)

## Writing Effective Scenarios

### Principle 1: One Scenario, One Outcome Path

Each scenario should test one primary outcome (happy path or one type of failure).

**Good:**
```markdown
### Scenario 1: Successful Login
- **GIVEN** user with correct password exists
- **WHEN** user enters correct credentials
- **THEN** user is logged in

### Scenario 2: Wrong Password
- **GIVEN** user exists in system
- **WHEN** user enters wrong password
- **THEN** login fails with error message
```

**Bad (mixes multiple outcomes):**
```markdown
### Scenario: Login
- **GIVEN** a user
- **WHEN** they log in
- **THEN** they might succeed or fail depending on password
- **AND** they see the dashboard or error message
```

### Principle 2: Use Concrete, Specific Values

**Vague:**
```markdown
- **GIVEN** a user
- **WHEN** they enter an email
- **THEN** something happens
```

**Specific:**
```markdown
- **GIVEN** a user account with email "alice@example.com"
- **WHEN** they enter email "alice@example.com" and correct password
- **THEN** they receive a JWT token valid for 24 hours
```

### Principle 3: Focus on What, Not How

Specify behavior, not implementation.

**Implementation-focused (avoid):**
```markdown
- **GIVEN** the database has a user record
- **WHEN** the authentication function hashes the password
- **THEN** the bcrypt result matches the stored hash
```

**Behavior-focused (better):**
```markdown
- **GIVEN** alice is registered with password "SecurePass123"
- **WHEN** alice logs in with correct password
- **THEN** authentication succeeds
```

### Principle 4: Make Scenarios Independent

Each scenario should work standalone.

**Dependent (bad):**
```markdown
### Scenario 1: User registers
- [Registration steps]
- **THEN** user is created

### Scenario 2: User logs in
- **GIVEN** the user from Scenario 1
- [Login steps]
```

**Independent (good):**
```markdown
### Scenario 1: User registration
- **GIVEN** [setup for registration]
- **WHEN** [registration action]
- **THEN** [registration succeeds]

### Scenario 2: User login
- **GIVEN** registered user "alice@example.com" exists
- **WHEN** [login action]
- **THEN** [login succeeds]
```

## Scenario Templates

### Template 1: Happy Path (Success)

```markdown
### Scenario: [Feature - Success Case]

- **GIVEN** [valid preconditions]
- **AND** [additional context]
- **WHEN** [user performs action]
- **THEN** [successful outcome]
- **AND** [related successful outcome]
```

**Example:**
```markdown
### Scenario: User creates account successfully

- **GIVEN** user "bob@example.com" is not yet registered
- **AND** the registration page is open
- **WHEN** bob enters email, password, and confirms
- **THEN** account is created successfully
- **AND** bob receives confirmation email
- **AND** bob is redirected to login page
```

### Template 2: Error/Failure Case

```markdown
### Scenario: [Feature - Failure Case]

- **GIVEN** [preconditions that lead to failure]
- **WHEN** [user performs action]
- **THEN** [specific error occurs]
- **AND** [system state is preserved]
```

**Example:**
```markdown
### Scenario: Login fails with wrong password

- **GIVEN** user "charlie@example.com" is registered
- **WHEN** charlie enters correct email but wrong password
- **THEN** login fails with error "Invalid credentials"
- **AND** charlie's account remains unlocked
- **AND** login attempt is logged for security
```

### Template 3: Edge Case / Boundary

```markdown
### Scenario: [Feature - Edge Case]

- **GIVEN** [boundary condition setup]
- **WHEN** [action at boundary]
- **THEN** [boundary handled correctly]
```

**Example:**
```markdown
### Scenario: Maximum password length

- **GIVEN** the maximum password length is 128 characters
- **WHEN** user sets password to exactly 128 characters
- **THEN** password is accepted
- **AND** all characters are stored correctly
```

### Template 4: Security/Permission

```markdown
### Scenario: [Feature - Permission/Security]

- **GIVEN** user with [role/permission] is trying action
- **WHEN** [action that requires permission]
- **THEN** [access granted/denied appropriately]
```

**Example:**
```markdown
### Scenario: Unauthorized access prevented

- **GIVEN** david is not logged in
- **WHEN** david tries to access the dashboard directly
- **THEN** david is redirected to login page
- **AND** no data is exposed
```

## Complete Scenario Example

Here's a feature with multiple well-written scenarios:

```markdown
# User Authentication Feature

## Scenarios

### Scenario 1: Successful Email/Password Login

- **GIVEN** user "alice@example.com" registered with password "Secure123!"
- **AND** alice is not currently logged in
- **WHEN** alice navigates to login page
- **AND** alice enters email "alice@example.com"
- **AND** alice enters password "Secure123!"
- **AND** alice clicks "Sign In" button
- **THEN** login succeeds
- **AND** alice receives JWT token with 24-hour expiration
- **AND** alice is redirected to dashboard
- **AND** alice sees "Welcome, Alice" personalization

### Scenario 2: Login Fails with Incorrect Password

- **GIVEN** user "bob@example.com" is registered
- **AND** bob is not logged in
- **WHEN** bob enters correct email "bob@example.com"
- **AND** bob enters incorrect password "WrongPass456"
- **AND** bob clicks "Sign In"
- **THEN** login fails
- **AND** bob sees error message "Email or password is incorrect"
- **AND** bob remains on login page
- **AND** bob is not logged in

### Scenario 3: Login Fails with Non-existent Email

- **GIVEN** no user account exists for "unknown@example.com"
- **WHEN** someone enters "unknown@example.com" in login
- **AND** they enter any password
- **AND** they click "Sign In"
- **THEN** login fails
- **AND** the error message shows "Email or password is incorrect"
- **AND** the system does NOT reveal whether email exists
- **AND** login attempt is logged for security

### Scenario 4: Account Lockout After Multiple Failures

- **GIVEN** user "charlie@example.com" exists
- **AND** charlie has failed login 5 times in the last 15 minutes
- **WHEN** charlie attempts to log in again
- **THEN** login is rejected
- **AND** charlie sees message "Account locked. Try again in 15 minutes."
- **AND** charlie receives security alert email
- **AND** support team is notified

### Scenario 5: Password Reset Token Works

- **GIVEN** "diana@example.com" has forgotten her password
- **AND** diana is at password reset page
- **WHEN** diana enters "diana@example.com"
- **AND** diana clicks "Send Reset Email"
- **THEN** password reset email is sent within 1 minute
- **AND** email contains unique reset link
- **WHEN** diana clicks the reset link in the email
- **AND** link is within 1-hour validity window
- **THEN** reset page loads with password entry field
- **WHEN** diana enters new password "NewPass789"
- **AND** confirms new password
- **AND** clicks "Update Password"
- **THEN** password is updated
- **AND** diana can log in with new password
- **AND** old password no longer works

### Scenario 6: Expired Reset Token is Rejected

- **GIVEN** diana received password reset link 2 hours ago
- **AND** reset link has 1-hour expiration
- **WHEN** diana clicks the expired reset link
- **THEN** page shows "Link has expired"
- **AND** diana must request a new reset email
- **AND** no password change occurs
```

## Common Mistakes in Scenarios

### Mistake 1: Too Much Implementation Detail

**Bad (too technical):**
```markdown
- **WHEN** the POST /api/auth/login endpoint receives a JSON payload
- **AND** bcrypt validates the hash against stored value
- **THEN** the JWT is signed with RS256 algorithm
```

**Good (behavior-focused):**
```markdown
- **WHEN** alice submits login form with credentials
- **THEN** alice receives authentication token
```

### Mistake 2: Missing Preconditions

**Bad (unclear setup):**
```markdown
- **GIVEN** a user
- **WHEN** they log in
- **THEN** they see the dashboard
```

**Good (clear setup):**
```markdown
- **GIVEN** user "alice@example.com" is registered
- **AND** alice is not currently logged in
- **WHEN** alice submits login credentials
- **THEN** alice sees the dashboard
```

### Mistake 3: Multiple Paths in One Scenario

**Bad (too many outcomes):**
```markdown
- **GIVEN** a user with valid or invalid credentials
- **WHEN** they click login
- **THEN** they succeed or see an error
```

**Good (one outcome per scenario):**
```markdown
### Scenario: Valid credentials
- **GIVEN** user with valid credentials
- **WHEN** they click login
- **THEN** they succeed

### Scenario: Invalid credentials
- **GIVEN** user with invalid password
- **WHEN** they click login
- **THEN** they see error
```

### Mistake 4: Vague Assertions

**Bad (untestable):**
```markdown
- **THEN** the system behaves correctly
- **AND** the response is good
- **AND** everything works fine
```

**Good (testable):**
```markdown
- **THEN** HTTP status 200 is returned
- **AND** response includes user ID and name
- **AND** authentication token is valid for 24 hours
```

## Scenario Coverage Checklist

For complete specifications, cover:

- [ ] Happy path: Normal successful flow
- [ ] Validation failures: Invalid input
- [ ] Error conditions: Expected failures
- [ ] Edge cases: Boundary values
- [ ] Security: Permission/authorization
- [ ] Integration: Multiple system interactions
- [ ] Concurrency: Race conditions (if applicable)
- [ ] Performance: Load or timeout scenarios
- [ ] Recovery: Error recovery steps

## Translating to Tests

Well-written GIVEN-WHEN-THEN scenarios translate easily to automated tests:

**Scenario:**
```markdown
### Scenario: User login succeeds

- **GIVEN** user "test@example.com" with password "Secret123"
- **WHEN** user submits login form
- **THEN** user receives JWT token
```

**Test Code:**
```typescript
test('User login succeeds', () => {
  // GIVEN
  const user = createUser('test@example.com', 'Secret123');

  // WHEN
  const response = submitLoginForm('test@example.com', 'Secret123');

  // THEN
  expect(response.token).toBeDefined();
  expect(isValidJWT(response.token)).toBe(true);
});
```

## Quick Checklist for Scenarios

Before finalizing scenarios:

- [ ] Scenario has clear GIVEN-WHEN-THEN structure
- [ ] GIVEN describes complete, specific preconditions
- [ ] WHEN describes single primary action
- [ ] THEN describes observable, testable outcome
- [ ] Scenario works independently
- [ ] Scenario uses concrete values, not abstractions
- [ ] Scenario focuses on behavior, not implementation
- [ ] Related outcomes use AND, alternative use OR
- [ ] Happy path and error cases both covered
- [ ] Edge cases are considered

---

Next: [RFC 2119 Keywords Guide](./rfc2119) | [Specification Writing Guide](./)
