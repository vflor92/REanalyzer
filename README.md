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

### Module 3: AI-Powered Deal Intake Wizard ✅
- **Smart PDF Parsing**: Upload OM flyers and let AI extract deal data automatically
- **Groq Integration**: Uses Llama 3.3 70B for intelligent text extraction (free tier)
- **Confidence Scoring**: Each field shows extraction confidence (0-1) with color-coded badges
- **Source Verification**: View exact text snippets used for each extracted field
- **Anti-Hallucination**: Strict prompts ensure no guessed data - only what's in the document
- **3-Step Wizard**: Upload → Review/Edit → Confirm before saving
- **Text Paste Mode**: Fallback option for quick text extraction
- **Zero Cost**: Leverages Groq's generous free tier (30 requests/min, 6000/day)

#### Groq API Setup

1. **Get API Key**
   - Visit https://console.groq.com/keys
   - Sign up (no credit card required)
   - Create new API key

2. **Configure Backend**
   ```bash
   cd backend
   echo "GROQ_API_KEY=your_key_here" >> .env
   ```

3. **Usage**
   - Navigate to http://localhost:3000/sites/wizard
   - Upload PDF or paste text
   - Review AI-extracted fields (edit as needed)
   - Click "Create Site" to save

### Coming Soon
- Advanced relationships (Demographics, RentComps, Scenarios)
- URL scraping with Puppeteer
- Bulk/batch upload
- Advanced analytics

## API Documentation

### Endpoints

**Sites**
- `GET /sites` - List sites with filters
- `GET /sites/:id` - Get site details
- `POST /sites` - Create new site
- `PATCH /sites/:id` - Update site
- `DELETE /sites/:id` - Delete site

**AI Wizard**
- `POST /intake/parse-om` - Parse PDF or text to extract deal data

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
