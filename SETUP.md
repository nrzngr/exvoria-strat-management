# Delta Force Strategy Manager - Setup Guide

## Overview
This is a strategy management platform for Delta Force esports teams, built with Next.js, TypeScript, Tailwind CSS, and Supabase (Database + Storage).

## Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone and Install Dependencies
```bash
npm install
```

### 2. Supabase Project Setup

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### Set Up Database
1. Run the SQL migration scripts in order:
   - `database/migrations/001_initial_schema.sql`
   - `database/migrations/002_functions_triggers.sql`

#### Set Up Storage
1. Run the storage setup script: `database/storage-setup.sql`
2. This creates two buckets:
   - `map-thumbnails` - for map thumbnail images
   - `strategy-images` - for strategy diagram images

### 3. Environment Configuration
1. Copy `.env.example` to `.env.local`
2. Update the environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration
NEXT_PUBLIC_APP_NAME="Delta Force Strategy Manager"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Features

### Map Management
- ✅ Create, read, update, delete maps
- ✅ Search and filter maps
- ✅ Strategy count tracking
- 🔄 Map thumbnail uploads (coming soon)

### Strategy Management
- ✅ Strategy creation with map association
- ✅ Version control with change tracking
- ✅ Rich text descriptions
- 🔄 Image uploads for strategy diagrams (coming soon)

### Storage Architecture

#### Database Tables
- **maps**: Delta Force game maps with metadata
- **strategies**: Main strategy content
- **strategy_versions**: Version history tracking
- **strategy_images**: Image assets linked to strategies

#### Supabase Storage Buckets
- **map-thumbnails**: Map preview images
- **strategy-images**: Strategy diagrams and visuals

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking
```

### Project Structure
```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
├── lib/                 # Utility functions and configurations
│   ├── supabase.ts     # Supabase client configuration
│   ├── storage.ts      # Supabase Storage utilities
│   └── database.ts     # Database operations
├── types/               # TypeScript type definitions
└── globals.css          # Global styles

database/
├── schema.sql           # Complete database schema
├── migrations/          # Database migration files
└── storage-setup.sql    # Storage bucket and policies setup
```

## Production Deployment

### Environment Variables for Production
Make sure to set these environment variables in your hosting platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

### Supabase Configuration
1. Enable Row Level Security (RLS) in production
2. Review storage policies for appropriate access control
3. Set up proper authentication if needed

## Troubleshooting

### Common Issues

#### "Missing Supabase environment variables"
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`

#### Storage upload errors
- Run the `storage-setup.sql` script in your Supabase SQL editor
- Ensure storage buckets are created with correct policies

#### Database connection errors
- Verify your Supabase project URL and anon key
- Check that database migrations have been run

### Support
- Check the Supabase documentation at [supabase.com/docs](https://supabase.com/docs)
- Review Next.js documentation at [nextjs.org/docs](https://nextjs.org/docs)