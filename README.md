# NestBoard API

A multi-tenant REST API for collaborative project and task management, built with
NestJS, Prisma, and PostgreSQL.

Teams create workspaces, invite members with role-based permissions, organise work
into projects, and track tasks across a status board — with in-app notifications,
file attachments, and OTP-based account security.

---

## Features

- **Workspaces & multi-tenancy** — every project, task, and invitation is scoped to
  a workspace; membership is the boundary between tenants
- **Role-based access control** — three-tier roles (`OWNER`, `ADMIN`, `MEMBER`)
  enforced per workspace
- **Invitation lifecycle** — email-based invites with expiry, and a status flow of
  `PENDING → ACCEPTED / REJECTED / EXPIRED`
- **Projects & tasks** — tasks carry status (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`),
  priority (`LOW` → `URGENT`), due dates, and an integer `position` field for
  drag-and-drop board ordering
- **Notifications** — 17 event types covering membership changes, project CRUD,
  task assignment, status transitions, completion, and due-date warnings, each with
  per-recipient read state
- **OTP security flows** — typed, expiring one-time codes for account verification
  and password reset
- **File attachments** — Cloudinary-hosted uploads attached to tasks, tracking MIME
  type, byte size, and public ID for cleanup

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS (TypeScript) |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT + OTP verification |
| File storage | Cloudinary |
| Runtime | Node.js |

