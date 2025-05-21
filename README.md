# BitDash Firestudio

> A modern NextJS starter with Firebase integration, TypeScript, and Shadcn/ui

## Overview

BitDash Firestudio is a production-ready NextJS starter template pre-configured with:

- **Next.js 14+** with App Router
- **Firebase** (Auth, Firestore, Storage)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/ui** for accessible components
- **ESLint** + **Prettier** for code quality
- **Husky** for Git hooks

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bitdash-firestudio.git
   cd bitdash-firestudio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Update the values in `.env.local` with your Firebase config.

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
.
├── app/                    # App router pages and layouts
├── components/             # Reusable UI components
│   ├── ui/                 # Shadcn/ui components
│   └── shared/             # Custom shared components
├── lib/                    # Utility functions and configs
│   └── firebase/           # Firebase configuration
├── public/                 # Static assets
├── styles/                 # Global styles
└── types/                  # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Documentation](https://ui.shadcn.com/docs)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
