# K-COAT Studio

## Overview

K-COAT Studio is a blog automation dashboard for K-COAT paint construction services. The application enables users to input construction site information, upload before/after photos, and generate SEO-optimized blog content using AI. The generated content is formatted for direct copy-paste into Naver Blog's smart editor.

**Core Purpose:** Streamline the creation of marketing blog posts for paint/coating construction projects by automating content generation from site data and photos.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 6 for fast development and bundling
- **Styling:** Tailwind CSS via CDN, custom CSS variables for brand colors
- **Icons:** Lucide React icon library
- **State Management:** React useState hooks (no external state library)

### Application Flow
The app follows a 4-step wizard pattern:
1. **Step 1 (Form):** Collect construction site metadata (building name, date, product type, issues)
2. **Step 2 (Upload):** Bulk upload before/after photo pairs with automatic pairing by filename
3. **Step 3 (Workspace):** AI content generation with real-time progress, drag-and-drop block editor for content arrangement
4. **Step 4 (Success):** Confirmation and reset options

### Content Generation
- **Webhook Integration:** Sends form data and photos to an n8n webhook endpoint for AI processing
- **Response Format:** Expects structured sections (intro, product, FAQ, tech, philosophy, etc.) with HTML content blocks
- **Rich Text Clipboard:** Custom clipboard API implementation for copying formatted HTML to Naver Blog editor

### Design Decisions
- **Korean-first:** All UI text in Korean targeting Korean market users
- **Brand Colors:** Orange (#FF6B35) as primary, Navy (#1A1D2E) as secondary, Ivory (#FAF9F6) background
- **Photo Processing:** Base64 encoding for photo uploads, automatic before/after pairing by filename sort order
- **Block Editor:** Drag-and-drop content blocks allow users to rearrange AI-generated sections before copying

## External Dependencies

### Third-Party Services
- **n8n Webhook:** External automation platform endpoint at `https://primary-production-c55d.up.railway.app/webhook-test/send-email` for AI content generation
- **Gemini API:** API key configured via environment variable `GEMINI_API_KEY` (optional, used for AI features)

### NPM Packages
- `react` / `react-dom` (v19) - Core UI framework
- `lucide-react` - Icon library
- `vite` with `@vitejs/plugin-react` - Build tooling
- `typescript` - Type safety

### Browser APIs
- **Clipboard API:** ClipboardItem for rich HTML copy functionality
- **FileReader API:** Base64 encoding for photo uploads
- **Camera Permission:** Requested for potential mobile photo capture (noted in metadata.json)