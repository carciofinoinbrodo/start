# AI SEO Dashboard - Frontend

A React dashboard for tracking brand visibility across AI search engines (like Google AI Mode, ChatGPT, Perplexity).

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS 4** (with CSS variables, not tailwind.config.js)
- **Recharts** for data visualization
- **React Router v7** for navigation
- **Lucide React** for icons

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── VisibilityChart.tsx      # Main line chart with comparison mode
│   │   │   ├── BrandComparisonToggle.tsx # Brand selection chips for comparison
│   │   │   └── ChartDrilldownModal.tsx   # Modal showing daily breakdown
│   │   ├── layout/
│   │   │   ├── Header.tsx               # Top header with search and user menu
│   │   │   ├── Sidebar.tsx              # Navigation sidebar (static/overlay)
│   │   │   ├── Layout.tsx               # Main layout wrapper
│   │   │   ├── MobileNav.tsx            # Hamburger menu for mobile
│   │   │   └── Backdrop.tsx             # Overlay backdrop for mobile sidebar
│   │   ├── search/
│   │   │   ├── GlobalSearch.tsx         # Search input with Cmd/K shortcut
│   │   │   ├── SearchResults.tsx        # Grouped search results dropdown
│   │   │   └── SearchResultItem.tsx     # Individual search result
│   │   └── ui/
│   │       ├── Badge.tsx                # TrendBadge, SentimentBadge components
│   │       ├── DataTable.tsx            # Generic table with column alignment
│   │       ├── MetricCard.tsx           # KPI cards with icons
│   │       └── Modal.tsx                # Reusable modal component
│   ├── contexts/
│   │   └── AppContext.tsx               # Global state (sidebar open/closed)
│   ├── hooks/
│   │   ├── useDebounce.ts               # Debounce values (for search)
│   │   ├── useMediaQuery.ts             # Breakpoint detection
│   │   ├── useClickOutside.ts           # Click outside detection
│   │   ├── useLocalStorage.ts           # Persist state to localStorage
│   │   └── useGlobalSearch.ts           # Search across prompts/brands/sources
│   ├── data/
│   │   └── mockData.ts                  # Sample data for development
│   ├── pages/
│   │   ├── Dashboard.tsx                # Main dashboard with charts and tables
│   │   └── Prompts.tsx                  # Expandable prompts table
│   ├── types/
│   │   └── index.ts                     # TypeScript interfaces
│   ├── index.css                        # Global styles and CSS variables
│   └── main.tsx                         # App entry point with providers
```

## Key Features

### 1. Global Search
- Debounced search (300ms) across prompts, brands, and sources
- Keyboard shortcut: `Cmd/Ctrl + K` to focus
- Arrow key navigation, Enter to select, Escape to close
- Click outside to dismiss dropdown

### 2. Responsive Sidebar
- **Desktop (>=1024px)**: Static sidebar always visible
- **Mobile/Tablet (<1024px)**: Overlay sidebar with backdrop
- Hamburger menu in header on smaller screens
- Sidebar preference persisted to localStorage

### 3. Interactive Charts
- **Comparison Mode**: Click "Compare" button, select up to 2 brands
- **Drill-down Modal**: Click on chart to see daily breakdown for all brands
- Time range selector: 7d, 30d, 90d

### 4. Data Tables
- Generic `DataTable` component with column alignment support
- Column alignment: `'left' | 'center' | 'right'`
- Hover highlight with left border accent
- Expandable rows on Prompts page

## Design System

### CSS Variables (defined in index.css)
```css
--bg-primary: #0a0a0f          /* Main background */
--bg-secondary: #12121a        /* Card backgrounds */
--bg-elevated: #1a1a24          /* Elevated surfaces */
--text-primary: #f8fafc         /* Primary text */
--text-secondary: #94a3b8       /* Secondary text */
--text-muted: #64748b           /* Muted text */
--accent-primary: #3b82f6       /* Primary accent (blue) */
--accent-success: #10b981       /* Success (green) */
--accent-warning: #f59e0b       /* Warning (amber) */
--accent-danger: #ef4444        /* Danger (red) */
--border-subtle: rgba(255,255,255,0.06)
```

### Responsive Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px (sidebar breakpoint)
- `xl`: 1280px
- `2xl`: 1536px (table grid breakpoint)

## Important Implementation Details

### CSS Specificity Issues
1. **Input padding**: The `.input-dark` class uses shorthand `padding` which overrides Tailwind utilities. Use inline `style={{ paddingLeft: '2.5rem' }}` for search inputs with icons.

2. **Table alignment**: Removed `text-align: left` from `.table-dark th` to allow Tailwind's `text-center` class to work.

3. **Table row positioning**: `position: relative` on `<tr>` elements causes alignment issues in tables. Moved to `td:first-child` only for the hover highlight effect.

### Tailwind CSS 4
- Uses CSS-based configuration, not `tailwind.config.js`
- Import with `@import "tailwindcss"` in index.css
- Custom utilities defined directly in CSS with `@theme` or standard CSS

## Running the Project

```bash
cd frontend
npm install
npm run dev
```

Development server runs at `http://localhost:5173`

## Data Types

```typescript
interface Brand {
  id: string;
  name: string;
  visibility: number;      // 0-100
  trend: 'growing' | 'stable' | 'declining';
  sentiment: 'positive' | 'neutral' | 'negative';
  avgPosition: number;
  color: string;           // Hex color for charts
  type: 'primary' | 'competitor';
}

interface Prompt {
  id: string;
  query: string;
  visibility: number;
  avgPosition: number;
  totalMentions: number;
  brands: PromptBrandMention[];
}

interface Source {
  domain: string;
  usage: number;          // 0-100
  avgCitations: number;
}

interface SearchResult {
  id: string;
  type: 'prompt' | 'brand' | 'source';
  title: string;
  subtitle?: string;
  href: string;
}
```

## Future Improvements

- [ ] Connect to real API backend
- [ ] Add date range picker for charts
- [ ] Export data to CSV/PDF
- [ ] User authentication
- [ ] Settings page functionality
- [ ] Dark/Light theme toggle
