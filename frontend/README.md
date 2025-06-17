# Research Data Repository - Frontend

This is the frontend application for the Research Data Repository platform, built with Next.js, React, and TypeScript.

## Features

- User authentication and authorization
- Dataset upload, management, and discovery
- File preview and download functionality
- Admin panel for content moderation
- Cross-tab authentication support

## Cross-Tab Authentication

The application supports maintaining authentication state across multiple browser tabs. When a user opens a link in a new tab, they will automatically be authenticated without needing to log in again.

### How it works:

1. **localStorage Storage**: Authentication tokens are stored in `localStorage` instead of `sessionStorage`, allowing them to be shared across tabs
2. **Storage Event Listener**: The app listens for storage events to sync authentication state when tokens are updated or removed in other tabs
3. **Automatic Token Validation**: Each tab automatically validates tokens on load and periodically checks for expiration

### Testing Cross-Tab Authentication:

1. Log into the application
2. Use the test buttons on the home page to open authenticated pages in new tabs
3. The new tabs should automatically be authenticated without requiring login

### Implementation Details:

- **AuthContext**: Uses `localStorage` for token persistence and includes storage event listeners
- **AuthSessionManager**: Handles token refresh and expiration checking across all tabs
- **Consistent Storage Keys**: Uses `accessToken` key consistently across all components

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND=http://localhost:8000
```

## Project Structure

- `/src/app` - Next.js app router pages and layouts
- `/src/app/features` - Feature-based component organization
- `/src/app/components` - Reusable UI components (atoms, molecules, organisms)
- `/src/app/lib` - Utility functions and configurations

## Authentication Flow

1. User logs in through `/login` page
2. Token is stored in localStorage and decoded to extract user information
3. AuthContext provides authentication state to all components
4. Protected routes redirect unauthenticated users to login
5. New tabs automatically inherit authentication state from localStorage
