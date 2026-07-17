# OMS Project Handoff

Last updated: July 17, 2026

## 1. Project overview

This repository is an OMS-style multi-company internal workspace application.

There are currently 2 company experiences:

- `Pakrose Enterprises`
- `Prime Fabric Pakistan`

The app has:

- a shared Google-login entry flow
- frontend dashboards built with static HTML + Tailwind + vanilla JavaScript
- a Node.js/Express backend
- JSON-file persistence for now

The final planned step is to move persistence to a real database, most likely PostgreSQL.

## 2. Current repo structure

Top-level folders:

- `assets/`
  - shared frontend JavaScript
- `backend/`
  - Node/Express backend
- `dashboard/`
  - one dashboard frontend variant
- `pakrose/`
  - Pakrose frontend
- `prime-fabric/`
  - Prime Fabric frontend
- `index.html`
  - login entry page

Important backend files:

- `backend/server.js`
- `backend/src/app.js`
- `backend/src/config/auth.js`
- `backend/src/config/companies.js`
- `backend/src/controllers/companyWorkspaceController.js`
- `backend/src/controllers/primeFabricController.js`
- `backend/src/routes/companyWorkspaceRoutes.js`
- `backend/src/routes/primeFabricRoutes.js`
- `backend/src/services/workspaceService.js`
- `backend/src/services/primeFabricService.js`
- `backend/src/repositories/jsonWorkspaceRepository.js`
- `backend/src/repositories/jsonPrimeFabricRepository.js`

Important frontend files:

- `index.html`
- `assets/login.js`
- `assets/dashboard.js`
- `dashboard/index.html`
- `pakrose/dashboard/index.html`
- `prime-fabric/dashboard/index.html`

## 3. Tech stack

### Frontend

- HTML
- Tailwind via CDN
- vanilla JavaScript
- Google Identity Services for login

### Backend

- Node.js
- Express
- `google-auth-library`
- `cors`
- `dotenv`

### Persistence

- JSON files only for now
- no SQL database yet

## 4. Authentication flow

Current auth flow:

1. User opens the login page
2. User signs in with Google
3. Frontend sends Google credential to `POST /api/auth/google`
4. Backend verifies token
5. Backend checks if the email is allowlisted
6. Access is granted only for allowed users

Auth config:

- allowed emails are now environment-driven via `ALLOWED_EMAILS`
- fallback default emails still exist in code in `backend/src/config/auth.js`

This means production should use:

- `backend/.env`
- `ALLOWED_EMAILS=email1,email2,...`

## 5. Company separation

### Pakrose

Pakrose uses the generic company workspace system:

- route prefix: `/api/v1/companies/:companyId`
- service: `workspaceService`
- repository: `jsonWorkspaceRepository`

### Prime Fabric

Prime Fabric now uses a dedicated workspace API:

- route prefix: `/api/v1/prime-fabric`
- service: `primeFabricService`
- repository: `jsonPrimeFabricRepository`

This split was done because Prime Fabric workflows became much more custom than Pakrose.

## 6. Prime Fabric: what is implemented

Prime Fabric has its own dashboard and internal record system.

Implemented major areas:

### 6.1 Workspace home

Prime Fabric record home contains:

- Employee record
- Project record
- Machine record
- Store
- Template Vault

### 6.2 Employee record / attendance

Implemented:

- professional attendance UI
- monthly history cards
- older month cards collapse by default
- current month remains visible
- monthly Excel export
- attendance team is no longer hardcoded to 15 people
- user can add tailor names and save attendance team
- saved team is used in:
  - daily attendance rows
  - monthly history
  - attendance export

Important note:

- attendance data is stored inside `attendanceRecords`
- attendance team metadata is stored under `attendanceRecords.__meta.team`

### 6.3 Project record

Implemented:

- create projects
- multiple order items per project
- item target pieces
- tailor per-piece rate
- client locked amount
- advance payment
- start date
- deadline days
- auto daily target calculation
- one day buffer logic

Business logic currently implemented:

- if order is `N` days, production planning uses `N - 1` days
- last day is reserved for packing/delivery
- project status auto-derives:
  - `not_started`
  - `active`
  - `completed`
  - `failed`

Status behavior:

- project is `not_started` before team lock
- project is `active` after team finalization
- project becomes `completed` when target pieces are fully done
- project becomes `failed` if full due date passes and work is incomplete

Failed project behavior:

- failed project is locked
- daily entries blocked
- weekly settlements blocked
- project updates blocked
- UI disables editing state for failed projects

### 6.4 Team finalization

Project team flow:

- team is added after project creation
- team is finalized in Step 1
- once finalized, team lock is enabled
- backend prevents changing locked tailor structure

### 6.5 Daily production entry

Implemented:

- per-day production entry
- shared save flow via one `Close Card` action
- item-level production quantities
- item overflow protection
- total target overflow protection
- forward date order enforcement
- cannot enter after production deadline

### 6.6 Weekly settlement

Implemented:

- daily entries grouped into 7-day weeks
- week cards auto-generated
- weekly payment status
- cannot mark incomplete week as paid
- cannot start next week unless previous full 7-day week is paid

### 6.7 Store

Implemented:

- simple item list
- quantity editing
- add item
- delete item

### 6.8 Machines

Implemented:

- machine list
- working/faulty status
- status can be updated

### 6.9 Template Vault

Implemented:

- Prime Fabric Template Vault screen
- upload file
- download file
- delete file
- any extension allowed
- file metadata stored:
  - id
  - name
  - extension
  - mimeType
  - size
  - uploadedAt
  - contentDataUrl

Current protection:

- upload size guard on frontend: 10 MB max

Current limitation:

- files are still stored as base64 inside JSON
- this is acceptable only for small internal usage, not ideal for long-term production scale

## 7. Pakrose: what is implemented

Pakrose uses the generic workspace model with these areas:

- Government
- NGOs
- Private
- Daily Expenses
- Store
- Template Vault

Implemented capabilities:

- create organizations
- add expense entries
- funding/account total tracking
- store item management
- template vault upload/download/delete

Pakrose template vault already existed and was used as the visual reference for Prime Fabric vault.

## 8. Prime Fabric backend routes

Current Prime Fabric backend routes:

- `GET /api/v1/prime-fabric/workspace`
- `GET /api/v1/prime-fabric/projects`
- `POST /api/v1/prime-fabric/projects`
- `PATCH /api/v1/prime-fabric/projects/:projectId`
- `DELETE /api/v1/prime-fabric/projects/:projectId`
- `PUT /api/v1/prime-fabric/projects/:projectId/daily-entries`
- `PUT /api/v1/prime-fabric/projects/:projectId/weekly-settlements`
- `PUT /api/v1/prime-fabric/workspace/projects`
- `PUT /api/v1/prime-fabric/workspace/attendance`
- `PUT /api/v1/prime-fabric/workspace/store-items`
- `PUT /api/v1/prime-fabric/workspace/machines`
- `PUT /api/v1/prime-fabric/workspace/template-vault`

## 9. Persistence model right now

### Pakrose

Stored under:

- `backend/data/companies/...`

### Prime Fabric

Stored under:

- `backend/data/prime-fabric/workspace.json`

Prime Fabric workspace JSON currently holds:

- `projects`
- `attendanceRecords`
- `storeItems`
- `machineRecords`
- `templateVault`

## 10. Integration improvements already done

These were fixed recently:

- Prime Fabric save flows no longer silently pretend success on backend failure
- attendance/save/store/machine/template-vault section syncs now surface errors
- Prime Fabric template vault added to backend persistence
- Prime Fabric template vault matched visually closer to Pakrose template vault
- outdated “all 15 tailors” project subtitle text removed
- attendance no longer depends on hardcoded 15 names
- failed project status logic added in frontend and backend

## 11. Production prep already done

Completed production-prep items:

- `backend/.env.example` created
- PM2 config created in `backend/ecosystem.config.js`
- PM2 scripts added to `backend/package.json`
- allowlist moved to environment-based config
- backend README updated with production checklist

Current environment variables expected:

- `PORT`
- `GOOGLE_CLIENT_ID`
- `FRONTEND_ORIGIN`
- `ALLOWED_EMAILS`

## 12. What is still not fully production-grade

Even though a lot is done, the project is not yet ideal production architecture.

### 12.1 Still using JSON instead of database

Current data layer is file-based JSON.

Problems:

- poor concurrency handling
- fragile if many users save at same time
- hard to scale
- hard to query/report properly
- template vault file storage in JSON is not ideal

### 12.2 No real object/file storage

Template files are stored inline in JSON as base64.

For production this should eventually move to:

- disk storage with metadata in DB, or
- object storage like S3, Cloudflare R2, Supabase storage, etc.

### 12.3 No test suite yet

There are no automated tests yet for:

- backend routes
- service logic
- frontend critical flows

### 12.4 Manual deployment state still messy

At the time of this handoff, some Prime Fabric files may still be untracked in git on the local machine, depending on whether they were committed yet.

Before deployment, verify git status carefully.

## 13. Recommended next step

The agreed final major step is:

### Migrate persistence to PostgreSQL

Recommended target:

- keep current frontend
- keep Node/Express backend
- replace JSON repositories with PostgreSQL-backed repositories

Suggested migration order:

1. Design database schema
2. Migrate Pakrose workspace tables
3. Migrate Prime Fabric tables
4. Migrate auth-related configuration if needed
5. Move template vault metadata into DB
6. Move actual file storage out of JSON

## 14. Suggested PostgreSQL schema areas

### For Prime Fabric

- `prime_fabric_projects`
- `prime_fabric_order_items`
- `prime_fabric_tailors`
- `prime_fabric_daily_entries`
- `prime_fabric_weekly_settlements`
- `prime_fabric_attendance_days`
- `prime_fabric_attendance_rows`
- `prime_fabric_attendance_team`
- `prime_fabric_store_items`
- `prime_fabric_machine_records`
- `prime_fabric_template_files`

### For Pakrose

- `companies`
- `workspace_funding_history`
- `workspace_organizations`
- `workspace_expense_entries`
- `workspace_daily_expenses`
- `workspace_store_items`
- `workspace_template_files`

## 15. Important frontend/backend files for next GPT

If another GPT continues this work, the most important files to inspect first are:

- `assets/dashboard.js`
- `backend/src/app.js`
- `backend/src/config/auth.js`
- `backend/src/controllers/primeFabricController.js`
- `backend/src/routes/primeFabricRoutes.js`
- `backend/src/services/primeFabricService.js`
- `backend/src/repositories/jsonPrimeFabricRepository.js`
- `backend/src/controllers/companyWorkspaceController.js`
- `backend/src/routes/companyWorkspaceRoutes.js`
- `backend/src/services/workspaceService.js`
- `backend/src/repositories/jsonWorkspaceRepository.js`
- `prime-fabric/dashboard/index.html`
- `dashboard/index.html`
- `pakrose/dashboard/index.html`

## 16. Recommended prompt for next GPT

Use something like this:

> Read `PROJECT_HANDOFF.md` first. This repo has a multi-company OMS app with Pakrose and Prime Fabric. Prime Fabric has a dedicated backend under `/api/v1/prime-fabric` and currently uses JSON persistence. We want the next step to be production-grade database migration to PostgreSQL without breaking current frontend behavior. Please inspect the current repositories, services, controllers, and frontend integration and propose the PostgreSQL schema plus migration plan first before editing code.

## 17. Final status summary

### Done

- Google login flow
- multi-company frontend
- Pakrose workspace APIs
- Prime Fabric dedicated APIs
- Prime Fabric attendance
- Prime Fabric projects
- Prime Fabric team finalization
- Prime Fabric daily production logic
- Prime Fabric weekly settlements
- Prime Fabric machine record
- Prime Fabric store
- Prime Fabric template vault
- failed project locking
- production env template
- PM2 config

### Not done yet

- PostgreSQL/database migration
- proper file/object storage
- automated tests
- full production deployment hardening

