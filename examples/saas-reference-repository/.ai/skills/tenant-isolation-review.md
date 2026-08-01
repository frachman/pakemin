# Tenant Isolation Review

## Purpose

Use this skill when reviewing changes that read or write tenant-scoped data.

## Review Points

- Confirm every data access path includes a tenant boundary.
- Confirm authorization checks happen before returning tenant data.
- Confirm logs and errors do not expose tenant secrets or customer message bodies.
- Confirm tests cover cross-tenant access denial.

