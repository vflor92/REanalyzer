# Land Acquisitions App

Full-stack application for analyzing and managing land acquisition deals.

## Tech Stack

### Backend
- **NestJS** - TypeScript framework
- **Prisma 7** - ORM with PostgreSQL
- **PostgreSQL** - Database (cloud-hosted)

### Frontend
- **Next.js 16** - React framework with App Router
- **shadcn/ui** - UI component library
- **React Query** - State management
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm run start:dev
```

Backend runs on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

### Database

The application uses a cloud-hosted PostgreSQL database via Prisma. The connection string is configured in `backend/.env`.

To run migrations:
```bash
cd backend
npx prisma migrate dev
```

## Features

### Module 1: Core Data Model ✅
- Prisma schema with 7 models (Site, Constraints, Utilities, Demographics, etc.)
- PostgreSQL with optimized indexes
- Cascade delete relationships

### Module 2: Basic Deal CRUD ✅
- Full REST API with filtering, sorting, pagination
- Auto-calculation of derived fields (sizeSf, askPricePerSf)
- React Query integration
- Form validation with Zod
- Responsive UI with shadcn/ui components

### Coming Soon
- Module 3: Advanced relationships (Demographics, RentComps, Scenarios)
- File uploads
- Bulk operations
- Advanced analytics

## API Documentation

### Endpoints

- `GET /sites` - List sites with filters
- `GET /sites/:id` - Get site details
- `POST /sites` - Create new site
- `PATCH /sites/:id` - Update site
- `DELETE /sites/:id` - Delete site

See [walkthrough.md](./docs/walkthrough.md) for detailed API documentation.

## Project Structure

```
land-acquisitions-app/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── sites/   # Sites CRUD module
│   │   └── prisma/  # Database schema
│   └── package.json
├── frontend/         # Next.js UI
│   ├── src/
│   │   ├── app/     # Pages (App Router)
│   │   ├── components/
│   │   ├── lib/     # React Query, API client
│   │   └── types/
│   └── package.json
└── docs/            # Documentation
```

## License

Private project
