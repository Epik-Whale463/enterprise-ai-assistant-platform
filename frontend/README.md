# AI Assistant Frontend

A modern, minimalistic Next.js frontend built with Shadcn/ui components for the AI Assistant application.

## Features

- 🎨 **Modern UI**: Built with Shadcn/ui and Tailwind CSS
- ⚡ **Fast**: Next.js 14 with App Router
- 📱 **Responsive**: Mobile-first design
- 🎯 **TypeScript**: Full type safety
- 🔧 **Tool Integration**: Real-time tool usage indicators
- 🎭 **Animations**: Smooth transitions and hover effects
- 🌙 **Dark Mode Ready**: Built-in dark mode support

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Components**: Shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Language**: TypeScript
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Python Flask backend running on port 5000

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend Integration

The frontend is configured to proxy API requests to the Flask backend running on `http://localhost:5000`. Make sure your Flask app is running before starting the frontend.

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page (Chat)
│   │   └── tools/
│   │       └── page.tsx     # Tools page
│   ├── components/
│   │   ├── ui/              # Shadcn/ui components
│   │   └── navigation.tsx   # Navigation component
│   ├── hooks/
│   │   └── use-toast.ts     # Toast hook
│   └── lib/
│       └── utils.ts         # Utility functions
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## Available Pages

- **/** - Main chat interface with tool integration
- **/tools** - Comprehensive tools documentation

## Components

### UI Components (Shadcn/ui)
- Button
- Card
- Textarea
- Toast
- Badge

### Custom Components
- Navigation
- Tool Cards
- Chat Interface

## API Integration

The frontend communicates with the Flask backend through:

- `POST /api/chat` - Send messages and receive AI responses
- Automatic tool detection and usage indicators
- Real-time toast notifications for tool usage

## Customization

### Adding New Tools

1. Add tool definition to `toolCards` array in `src/app/page.tsx`
2. Add tool documentation to `tools` array in `src/app/tools/page.tsx`
3. Import appropriate Lucide React icon

### Styling

- Modify `tailwind.config.js` for theme customization
- Update CSS variables in `src/app/globals.css` for color scheme
- Component styles use Tailwind utility classes

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file for environment-specific configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new components
3. Ensure responsive design
4. Test on multiple screen sizes
5. Update documentation as needed