# Security Rules

Never log customer message bodies, access tokens, session identifiers, or tenant secrets.

Every tenant-scoped query must include an explicit tenant identifier.

Agents should report uncertainty about authorization boundaries instead of inventing policy.

