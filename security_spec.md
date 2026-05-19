# Security Specification for VocabX

## Data Invariants
- A user can only read and write their own profile document.
- `masteredWords`, `chatSessions`, and `messages` are subcollections of a specific user and only accessible by that user.
- Document IDs must be valid alphanumeric strings.
- Timestamps must be handled on the server.
- `uid` in the document must match the authenticated `request.auth.uid`.

## The "Dirty Dozen" Payloads (Forbidden)
1. User A tries to read User B's profile.
2. User A tries to update User B's level.
3. User A tries to delete User B's mastered word.
4. Payload with `isAdmin: true` injected into user profile.
5. Payload with a 1.5MB string as a word.
6. Payload with an invalid word ID containing special characters.
7. Payload with a fake `createdAt` timestamp from the client.
8. User A tries to list all `masteredWords` from all users.
9. User A tries to create a chat session for User B.
10. Payload missing the required `email` field in the user profile.
11. Payload with an invalid mastery level (e.g., -1 or 200).
12. Payload with a 50 character word in a 10 character field (if restricted).

## Test Runner (Logic)
- `tests/firestore.rules.test.ts` will verify these denials.
