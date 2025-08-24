# Frontend Documentation

This document provides an overview of the CareLens frontend application.

## Technology Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## Project Structure

```
frontend/
├── src/
│   ├── app/                # Main application pages
│   │   └── page.tsx        # Homepage
│   ├── components/         # Reusable components
│   │   └── ui/             # shadcn/ui components
│   ├── lib/                # Utility functions
│   └── styles/             # Global styles
├── public/                 # Static assets
├── package.json            # Project dependencies and scripts
└── next.config.mjs         # Next.js configuration
```

## Getting Started

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Run the development server:**

    ```bash
    npm run dev
    ```

    The application will be available at [http://localhost:3000](http://localhost:3000).
