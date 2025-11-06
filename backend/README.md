# Backend (NestJS + TypeScript)

## Setup

1. Create a `.env` file in this folder with:

```
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=4000
CORS_ORIGINS=http://localhost:3000
```

2. Install dependencies:

```bash
pnpm install
```

3. Run development server:

```bash
pnpm dev
```

4. Build and run production:

```bash
pnpm build
pnpm start:prod
```

## Endpoints

- `GET /health` - Health check endpoint
- `POST /rpc/generate_tasks_for_company` - Generate tasks for a company
  - Body: `{ company_id: string, start_date?: string, months_ahead?: number }`
- `POST /rpc/update_task_statuses` - Update overdue task statuses

## Project Structure

```
src/
├── main.ts                 # Application bootstrap
├── app.module.ts          # Root module
├── app.controller.ts      # Health check controller
├── supabase/
│   ├── supabase.module.ts # Supabase module (global)
│   └── supabase.service.ts # Supabase client service
└── rpc/
    ├── rpc.module.ts      # RPC module
    ├── rpc.controller.ts  # RPC endpoints
    ├── rpc.service.ts     # RPC business logic
    └── dto/               # Data Transfer Objects
        └── generate-tasks.dto.ts
```

## Notes

- Uses Supabase service role key on the server only. Never expose it to the frontend.
- Adjust `CORS_ORIGINS` to match your frontend URL(s).
- Uses class-validator for request validation.
- NestJS provides dependency injection, modules, and a structured architecture.
