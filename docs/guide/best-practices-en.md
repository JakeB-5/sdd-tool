# SDD Tool Best Practices

Proven strategies for effective Spec-Driven Development with SDD Tool.

## 1. Specification Writing

### Start with Constitution

Before writing any specs, define your project constitution.

**Why:** Sets the foundation for all specifications and decisions.

```bash
/sdd.constitution "Your project description"
```

**Constitution should include:**
- Core principles (what matters most)
- Technical principles (technology choices)
- Forbidden practices (what to avoid)

### Write Specs Before Code

This is the core of SDD methodology.

**Pattern:**
```
Spec → Plan → Tasks → Implement
```

**Benefits:**
- Clear requirements before coding
- Easier to discuss with team
- Early detection of gaps
- Better test coverage

### Use Clear, Unambiguous Language

**Good:**
```markdown
- The API SHALL return HTTP 200 on success
- Response time SHOULD be under 500ms
- The system SHALL NOT expose user IDs in errors
```

**Avoid:**
```markdown
- The API should work fast
- Try to return something
- Don't leak information
```

### Include Negative Test Cases

**Complete coverage:**
```markdown
### REQ-001: User Login

- Users SHALL be able to log in (positive)
- Invalid credentials SHALL be rejected (negative)
- Non-existent users SHALL be handled securely (edge case)
```

**Benefits:**
- Comprehensive requirements
- Prevents security gaps
- Better test coverage

### Keep Specs Updated

Specs should evolve with code.

**Anti-pattern:** Specs written, never updated
**Better:** Specs updated before code changes

**Workflow:**
1. Update spec
2. Update tests
3. Update code

### Use Consistent Terminology

Define terms in a glossary if complex.

**Example:**
```markdown
## Glossary

| Term | Definition |
|------|-----------|
| JWT | JSON Web Token - stateless auth token |
| Bearer Token | Authorization header containing JWT |
```

## 2. Domain Organization

### Structure Specs by Domain (v1.3.0+)

For projects with multiple features, use domains.

**Without domains (small projects):**
```
.sdd/specs/common/
├── user-auth/
├── password-reset/
└── profile/
```

**With domains (large projects):**
```
.sdd/specs/auth/
├── login/
├── logout/
└── password-reset/

.sdd/specs/profile/
├── edit-profile/
└── avatar/

.sdd/specs/payment/
├── checkout/
└── refund/
```

**Best practices:**
- Create domain for each major feature area
- Keep specs in 2-3 related domains small (< 20 specs)
- Document domain purpose
- Define dependencies between domains

### Define Domain Dependencies

```bash
sdd domain depends payment --on auth
sdd domain depends order --on payment
sdd domain graph
```

**Benefits:**
- Clear dependencies
- Helps with prioritization
- Identifies circular dependencies
- Documents architecture

### Use Context for Focused Work

```bash
sdd context set auth payment    # Focus on these domains
sdd context specs               # See specs in context
```

**When to use:**
- Large projects with many specs
- Working on specific feature area
- Reducing cognitive load

## 3. Team Collaboration

### Review Specs Before Implementation

**Workflow:**
1. Write spec
2. Team reviews spec
3. Approve spec
4. Implement to spec
5. Validate against spec

**Benefits:**
- Catches issues early
- Team alignment
- Shared understanding
- Better code quality

### Use Git Workflow

```bash
sdd git setup
```

**Includes:**
- Pre-commit hooks (validate specs)
- Commit message template
- Pre-push validation

**Benefits:**
- Enforce spec quality
- Audit trail of changes
- Prevent invalid commits

### Document Decisions

In spec, explain **why** not just **what**.

```markdown
## Technical Decisions

### Decision: Use JWT instead of Sessions

**Why:** Better for distributed systems and mobile apps
**Trade-off:** Requires token refresh mechanism
**Alternative considered:** OAuth 2.0 (overkill for current scope)
```

### Keep Team in Sync

Use `/sdd.chat` for collaborative specification.

**Pattern:**
1. One person starts spec with `/sdd.spec`
2. Team provides feedback
3. AI refines spec based on discussion
4. Finalize together

## 4. Quality Assurance

### Validate Early and Often

```bash
sdd validate                    # Quick validation
sdd validate --strict           # Strict mode
sdd quality                     # Quality scoring
```

**Best practice:** Validate specs in CI/CD

### Check Sync Status Regularly

```bash
sdd sync                        # All specs
sdd sync --threshold 80         # With threshold
sdd sync --ci                   # CI mode (fail if below)
```

**In CI/CD:**
```bash
sdd sync --ci --threshold 80 --json
```

### Use Quality Scoring

```bash
sdd quality --threshold 80
```

**Metrics checked:**
- Requirement clarity
- Scenario completeness
- RFC 2119 usage
- Format compliance

### Track Changes

```bash
sdd diff                        # Working directory
sdd diff --staged               # Staged changes
sdd impact feature-name         # Change analysis
```

## 5. Implementation

### Use TDD Pattern

Follow Test-Driven Development.

**Workflow:**
1. Read spec requirements
2. Write tests for requirements
3. Implement to pass tests
4. Validate against spec

**Benefits:**
- Code matches spec
- Tests provide spec verification
- Fewer bugs
- Self-documenting tests

### Leverage /sdd.prepare

Auto-detects tools needed.

```bash
sdd prepare feature-name        # Interactive
sdd prepare feature-name --auto-approve  # Auto
```

**Generates:**
- Test runners
- Component generators
- API scaffolders
- Documentation generators

### Reference Specs in Code

Link code to spec requirements.

```typescript
/**
 * User login handler
 * @spec REQ-001 Email/Password Login
 * @scenario Scenario 1: Successful Login
 */
export async function login(email: string, password: string) {
  // Implementation
}
```

### Test Against Scenarios

Each scenario should have a test.

**Scenario:**
```markdown
### Scenario: Login Success
- **GIVEN** user with valid credentials
- **WHEN** they submit login
- **THEN** they receive JWT token
```

**Test:**
```typescript
test('User receives JWT token on successful login', () => {
  const token = loginUser('alice@example.com', 'Secure123!');
  expect(isValidJWT(token)).toBe(true);
  expect(token).toBeDefined();
});
```

## 6. Large Projects

### Progressive Spec Coverage

Don't try to spec everything at once.

**Phase 1: Core Features**
- Spec 5-10 core features
- Get team aligned
- Establish patterns

**Phase 2: Expansion**
- Spec more features
- Reuse patterns
- Improve faster

**Phase 3: Complete Coverage**
- Fill remaining specs
- Improve older specs
- Optimize structure

### Use Reverse Extraction

Document existing code.

```bash
sdd reverse scan                # Analyze code
sdd reverse extract             # Create drafts
sdd reverse review              # Team review
sdd reverse finalize            # Approve
```

**Good for:**
- Documenting legacy features
- Brownfield projects
- Existing code documentation

### Manage Spec Growth

With 50+ specs:

1. Use domains effectively
2. Use context for focus
3. Regular cleanup (deprecate unused)
4. Archive completed changes
5. Document decision rationale

## 7. CI/CD Integration

### Setup CI Validation

```bash
sdd cicd setup github
```

**Includes:**
- Spec validation workflow
- Sync verification
- Quality checks
- Automated reporting

### Validation in Pipeline

```bash
# GitHub Actions example
- name: Validate Specs
  run: sdd validate --strict

- name: Check Sync
  run: sdd sync --ci --threshold 80

- name: Quality Report
  run: sdd report --format json
```

### Pre-commit Validation

```bash
sdd git setup
```

Automatically validates before commit.

**Benefits:**
- Catch issues early
- Prevent invalid specs in repo
- Enforce quality standards

## 8. Documentation

### Generate Reports

```bash
sdd report                      # Overview
sdd export --all                # Export all specs
sdd export --format html        # HTML version
```

**Benefits:**
- Share with stakeholders
- External documentation
- Archival format

### Export for Sharing

**HTML Export:**
```bash
sdd export --all --format html --theme dark
```

**JSON Export:**
```bash
sdd export --format json
```

**Markdown Export:**
```bash
sdd export --format markdown
```

## 9. Common Patterns

### Feature with Multiple Scenarios

```markdown
# User Authentication

## REQ-001: Email/Password Login
- Scenario 1: Valid credentials → Success
- Scenario 2: Invalid password → Error
- Scenario 3: Non-existent user → Error
- Scenario 4: Account locked → Error
```

### Core Feature + Extensions

```markdown
## REQ-001: Basic Search
[MUST have]

## REQ-002: Advanced Filters
[SHOULD have]

## REQ-003: Search Suggestions
[MAY have]
```

### Security + Usability

```markdown
## REQ-001: Secure Password Hashing
[SHALL - security]

## REQ-002: Helpful Error Messages
[SHOULD - usability]

## REQ-003: Account Recovery
[SHOULD - support]
```

## 10. Team Training

### Onboarding New Team Members

1. Share constitution
2. Review existing specs
3. Walk through one workflow
4. Have them write a simple spec
5. Review and provide feedback

**Resources:**
- [Getting Started Guide](./getting-started-en.md)
- [Specification Writing](../spec-writing/index-en.md)
- [Quick Reference](../../QUICK_REFERENCE.md)

### Regular Review Meetings

**Weekly:**
- Discuss new specs
- Review completed features
- Identify patterns
- Address questions

**Monthly:**
- Quality metrics review
- Process improvements
- Architecture alignment
- Team feedback

## Anti-Patterns to Avoid

### Anti-Pattern 1: Specs After Code

**Problem:** Specifications written after implementation
**Solution:** Write specs first

### Anti-Pattern 2: Vague Requirements

**Problem:** "System should be fast"
**Solution:** "Response time SHOULD be under 500ms"

### Anti-Pattern 3: Unmaintained Specs

**Problem:** Specs never updated after creation
**Solution:** Update specs when requirements change

### Anti-Pattern 4: No Scenario Testing

**Problem:** Specs without verifiable scenarios
**Solution:** Every spec includes GIVEN-WHEN-THEN scenarios

### Anti-Pattern 5: Mixing Domains

**Problem:** Related specs scattered across domains
**Solution:** Group related features in domains

### Anti-Pattern 6: Ignoring Sync Status

**Problem:** Code doesn't match specs
**Solution:** Regular `sdd sync` checks

## Continuous Improvement

### Measure What Matters

- Spec quality scores
- Sync coverage percentage
- Team velocity
- Bug discovery rate

### Collect Feedback

- Team retrospectives
- Stakeholder reviews
- Developer experience
- Maintenance effort

### Iterate on Process

1. Measure current state
2. Identify improvements
3. Implement changes
4. Measure results
5. Repeat

## Conclusion

SDD is a practice that improves with experience. Start simple, iterate, and build team expertise over time. The most important step is starting - begin with your next feature using SDD principles.

---

**Ready to practice SDD?** Start with [Getting Started Guide](./getting-started-en.md)

**Need more detail?** Check [CLI Reference](../cli/index-en.md)
