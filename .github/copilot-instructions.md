<!-- Custom instructions for this CV Optimizer project -->

## Project Overview

This is a CV Optimizer web application built with Next.js, TypeScript, and Tailwind CSS. The app allows users to upload their CV and a job description, then optimizes the CV to better match the job requirements while preserving factual integrity.

## Key Principles

### Integrity Rules
- NEVER add fake jobs, skills, or certifications
- NEVER alter dates, timelines, or contact information
- ONLY optimize wording and emphasis based on existing content
- ALWAYS preserve the original CV structure and style

### Technical Guidelines
- Use App Router patterns for Next.js
- API routes handle file parsing and optimization
- Components are in `src/components/ui/`
- Types are defined in `src/types/`

### File Parsing
- PDF files use pdfjs-dist
- DOCX files use mammoth
- Text can be pasted directly

### Styling
- Use Tailwind CSS utility classes
- Follow the existing design system (blue primary, professional look)
- Maintain responsive design patterns

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
