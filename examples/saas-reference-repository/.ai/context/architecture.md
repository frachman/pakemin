# Architecture

The sample SaaS architecture separates web, API, worker, and database responsibilities.

The web application owns user-facing workflows. The API owns authorization, tenant isolation, validation, and business operations. Background workers handle slow tasks such as notifications and report exports. The database stores tenant-scoped operational records.

All tenant-scoped reads and writes must include an explicit tenant boundary.

