import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./index.html",
    "../shared/**/*.{js,ts,jsx,tsx}"
  ],
  mode: 'jit',
  safelist: [
    // VOLLSTÄNDIGE SAFELIST - 100% ALLER STYLING-PROBLEME BEHEBEN
    
    // Design system colors - ALL combinations with ALL variants
    { pattern: /bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900)/, variants: ['hover', 'focus', 'active', 'group-hover', 'disabled'] },
    { pattern: /text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900)/, variants: ['hover', 'focus', 'group-hover', 'disabled'] },
    { pattern: /border-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900)/, variants: ['hover', 'focus', 'group-hover'] },
    
    // ALLE Farben mit ALLEN Transparenzen
    { pattern: /bg-(white|black|transparent)/, variants: ['hover', 'focus', 'active'] },
    { pattern: /bg-(white|black)\/(10|20|30|40|50|60|70|80|90|95)/, variants: ['hover', 'focus'] },
    { pattern: /text-(white|black|transparent)/, variants: ['hover', 'focus', 'group-hover'] },
    
    // Theme colors
    { pattern: /bg-(primary|secondary|destructive|background|card|muted|accent)/, variants: ['hover', 'focus', 'active'] },
    { pattern: /text-(primary|secondary|destructive|background|card|muted|accent)(-foreground)?/, variants: ['hover', 'focus'] },
    { pattern: /border-(primary|secondary|destructive|background|card|muted|accent|border|input)/, variants: ['hover', 'focus'] },
    
    // Layout utilities
    { pattern: /flex|grid|block|inline|hidden/ },
    { pattern: /flex-(col|row|wrap|nowrap)/ },
    { pattern: /justify-(start|end|center|between|around|evenly)/ },
    { pattern: /items-(start|end|center|baseline|stretch)/ },
    { pattern: /gap-[0-9]+/ },
    { pattern: /space-(x|y)-(0|1|2|3|4|5|6|8|10|12|16|20|24)/ },
    
    // Grid system
    { pattern: /grid-cols-(1|2|3|4|5|6|12)/ },
    { pattern: /(sm|md|lg|xl):grid-cols-(1|2|3|4|5|6|12)/ },
    { pattern: /col-span-(1|2|3|4|5|6|12)/ },
    
    // Sizing - extended
    { pattern: /w-(0|1|2|3|4|5|6|8|10|12|16|20|24|32|40|48|56|64|72|80|96|auto|full|screen|min|max|fit)/ },
    { pattern: /h-(0|1|2|3|4|5|6|8|10|12|16|20|24|32|40|48|56|64|72|80|96|auto|full|screen|min|max|fit)/ },
    { pattern: /w-(1\/2|1\/3|2\/3|1\/4|3\/4|1\/5|2\/5|3\/5|4\/5)/ },
    { pattern: /h-(1\/2|1\/3|2\/3|1\/4|3\/4|1\/5|2\/5|3\/5|4\/5)/ },
    { pattern: /min-(w|h)-(0|full|fit|min|max)/ },
    { pattern: /max-(w|h)-(none|full|fit|min|max|screen|7xl)/ },
    
    // Padding and margin - extended  
    { pattern: /p(x|y|t|b|l|r)?-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|8|10|12|16|20|24)/ },
    { pattern: /m(x|y|t|b|l|r)?-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|8|10|12|16|20|24)/ },
    { pattern: /-m(x|y|t|b|l|r)?-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|8|10|12|16|20|24)/ },
    
    // Border radius and shadows
    { pattern: /rounded(-none|-sm|-md|-lg|-xl|-2xl|-3xl|-full)?/ },
    { pattern: /shadow(-none|-sm|-md|-lg|-xl|-2xl|-inner)?/ },
    
    // Text styles
    { pattern: /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)/ },
    { pattern: /font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/ },
    { pattern: /text-(left|center|right|justify)/ },
    { pattern: /leading-(none|tight|snug|normal|relaxed|loose)/ },
    { pattern: /tracking-(tighter|tight|normal|wide|wider|widest)/ },
    
    // Opacity and transforms
    { pattern: /opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100)/ },
    { pattern: /scale-(0|50|75|90|95|100|105|110|125|150)/ },
    { pattern: /rotate-(0|1|2|3|6|12|45|90|180)/ },
    
    // Transitions and animations
    { pattern: /transition(-all|-colors|-opacity|-shadow|-transform)?/ },
    { pattern: /duration-(75|100|150|200|300|500|700|1000)/ },
    { pattern: /ease-(linear|in|out|in-out)/ },
    { pattern: /animate-(none|spin|ping|pulse|bounce)/ },
    
    // Position and z-index
    "relative", "absolute", "fixed", "sticky", "static",
    { pattern: /(top|right|bottom|left|inset)-(0|1|2|3|4|5|6|8|10|12|16|20|24|auto)/ },
    { pattern: /z-(0|10|20|30|40|50|auto)/ },
    
    // Display and overflow
    "block", "inline-block", "inline", "flex", "inline-flex", "table", "grid", "hidden",
    { pattern: /overflow-(auto|hidden|visible|scroll)/ },
    { pattern: /overflow-(x|y)-(auto|hidden|visible|scroll)/ },
    
    // Cursor and pointer events
    "cursor-default", "cursor-pointer", "cursor-wait", "cursor-text", "cursor-move", "cursor-not-allowed",
    "pointer-events-none", "pointer-events-auto",
    
    // Text utilities
    "whitespace-nowrap", "whitespace-pre", "whitespace-pre-line", "whitespace-pre-wrap", "whitespace-normal",
    "text-ellipsis", "text-clip", "break-words", "break-all", "truncate",
    
    // Backdrop and background utilities
    "backdrop-blur-sm", "backdrop-blur", "backdrop-blur-md",
    { pattern: /bg-gradient-to-(r|l|t|b|tr|tl|br|bl)/ },
    { pattern: /from-(slate|gray|blue|purple|green|red|yellow|orange)-(100|200|300|400|500|600|700|800|900)/ },
    { pattern: /to-(slate|gray|blue|purple|green|red|yellow|orange)-(100|200|300|400|500|600|700|800|900)/ },
    
    // Navigation and dropdown background utilities
    "bg-white/95", "bg-white/90", "bg-white/80", "backdrop-blur-md",
    
    // Pricing card icons and toggle
    "w-14", "h-14", "w-16", "h-16", "rounded-2xl", "w-4", "h-4", "w-5", "h-5", "w-6", "h-6", "w-8", "h-8", "w-11", "w-12", 
    "translate-x-6", "translate-x-0.5", "translate-x-0", "ml-0.5", "duration-200", "shadow-md", "animate-pulse",
    "bg-slate-100", "text-slate-900", "h-7", "w-7",
    
    // Badge styling
    "absolute", "-top-3", "left-1/2", "transform", "-translate-x-1/2", "font-semibold", "px-3", "py-1", "text-white", "z-10", "relative",
    
    // Toggle button styling
    "border", "border-slate-300", "border-slate-900", "bg-white",
    
    // Navigation styling
    "text-primary", "hover:text-primary", "text-slate-600", "space-x-6", "ml-8", "text-sm", "font-medium", "transition-colors",
    "border-slate-200", "shadow-lg",
    
    // Container and layout utilities - ERWEITERT FÜR ALLE STYLING-PROBLEME
    "container", "mx-auto", "my-auto", 
    "max-w-xs", "max-w-sm", "max-w-md", "max-w-lg", "max-w-xl", "max-w-2xl", "max-w-3xl", "max-w-4xl", "max-w-5xl", "max-w-6xl", "max-w-7xl",
    "max-w-none", "max-w-full", "max-w-screen-sm", "max-w-screen-md", "max-w-screen-lg", "max-w-screen-xl", "max-w-screen-2xl",
    
    // Text alignment - KRITISCH FÜR ZENTRIERUNG
    "text-left", "text-center", "text-right", "text-justify",
    
    // Main/Section Tags für bessere Semantik
    "main", "section", "article", "aside", "header", "footer", "nav",
    
    // Flexbox und Grid - KRITISCH FÜR LAYOUT
    "flex", "inline-flex", "flex-col", "flex-row", "flex-wrap", "flex-nowrap",
    "justify-start", "justify-end", "justify-center", "justify-between", "justify-around", "justify-evenly",
    "items-start", "items-end", "items-center", "items-baseline", "items-stretch",
    "self-start", "self-end", "self-center", "self-stretch", "self-auto",
    
    // VOLLSTÄNDIGE responsive Grid und Sizing
    "sm:grid-cols-1", "sm:grid-cols-2", "sm:grid-cols-3", "sm:grid-cols-4", "sm:grid-cols-5", "sm:grid-cols-6", "sm:grid-cols-12",
    "md:grid-cols-1", "md:grid-cols-2", "md:grid-cols-3", "md:grid-cols-4", "md:grid-cols-5", "md:grid-cols-6", "md:grid-cols-12",
    "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4", "lg:grid-cols-5", "lg:grid-cols-6", "lg:grid-cols-12",
    "xl:grid-cols-1", "xl:grid-cols-2", "xl:grid-cols-3", "xl:grid-cols-4", "xl:grid-cols-5", "xl:grid-cols-6", "xl:grid-cols-12",
    
    // ALLE Width/Height Bruchteile
    "w-1/2", "w-1/3", "w-2/3", "w-1/4", "w-3/4", "w-1/5", "w-2/5", "w-3/5", "w-4/5", "w-1/6", "w-5/6",
    "h-1/2", "h-1/3", "h-2/3", "h-1/4", "h-3/4", "h-1/5", "h-2/5", "h-3/5", "h-4/5", "h-1/6", "h-5/6",
    
    // KRITISCHE Größen für Icons und Komponenten
    "w-0.5", "h-0.5", "w-1.5", "h-1.5", "w-2.5", "h-2.5", "w-3.5", "h-3.5", "w-14", "h-14", "w-16", "h-16", "w-20", "h-20", "w-24", "h-24", "w-32", "h-32", "w-48", "h-48", "w-64", "h-64",
    
    // PADDING/MARGIN mit Dezimalstellen
    "p-0.5", "p-1.5", "p-2.5", "p-3.5", "px-0.5", "px-1.5", "px-2.5", "px-3.5", "py-0.5", "py-1.5", "py-2.5", "py-3.5",
    "m-0.5", "m-1.5", "m-2.5", "m-3.5", "mx-0.5", "mx-1.5", "mx-2.5", "mx-3.5", "my-0.5", "my-1.5", "my-2.5", "my-3.5",
    "ml-0.5", "mr-0.5", "mt-0.5", "mb-0.5",
    
    // TRANSFORM Klassen - KRITISCH für Animationen
    "transform", "translate-x-0", "translate-x-0.5", "translate-x-1", "translate-x-2", "translate-x-3", "translate-x-4", "translate-x-6", "translate-x-8", "translate-x-12",
    "-translate-x-1/2", "-translate-y-1/2", "translate-x-1/2", "translate-y-1/2",
    "scale-95", "scale-100", "scale-105", "scale-110", "scale-125", "scale-[1.02]",
    
    // BORDER RADIUS - alle Variationen
    "rounded-none", "rounded-sm", "rounded", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-3xl", "rounded-full",
    "rounded-t-none", "rounded-t-sm", "rounded-t", "rounded-t-md", "rounded-t-lg", "rounded-t-xl", "rounded-t-2xl", "rounded-t-3xl",
    "rounded-b-none", "rounded-b-sm", "rounded-b", "rounded-b-md", "rounded-b-lg", "rounded-b-xl", "rounded-b-2xl", "rounded-b-3xl",
    
    // SHADOW - alle Variationen
    "shadow-none", "shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl", "shadow-inner",
    "drop-shadow-none", "drop-shadow-sm", "drop-shadow", "drop-shadow-md", "drop-shadow-lg", "drop-shadow-xl", "drop-shadow-2xl",
    
    // Ring utilities for focus states
    { pattern: /ring-(0|1|2|4|8)/ },
    { pattern: /ring-(slate|gray|blue|purple|green|red|yellow|orange)-(100|200|300|400|500|600|700|800|900)/ },
    "ring-offset-2", "ring-offset-4", "ring-offset-background",
    "focus:ring-2", "focus:ring-offset-2", "focus:ring-ring",
    "focus-visible:outline-none", "focus-visible:ring-2", "focus-visible:ring-ring", "focus-visible:ring-offset-2",
    
    // Group hover states
    "group-hover:text-transparent", "group-hover:bg-gradient-to-r", "group-hover:from-purple-600", "group-hover:to-blue-600", "group-hover:bg-clip-text", "group-hover:scale-[1.02]",
    
    // Disabled states
    "disabled:pointer-events-none", "disabled:opacity-50", "disabled:cursor-not-allowed",
    
    // ============ SPEZIFISCHE KLASSEN AUS KOMPONENTEN ============
    
    // SIZING - ALLE Variationen die verwendet werden
    "min-h-screen", "min-h-full", "max-h-screen", "max-h-full",
    "w-screen", "h-screen", "min-w-0", "min-w-full", "max-w-none",
    
    // POSITIONING - ALLE Variationen
    "top-0", "right-0", "bottom-0", "left-0", "inset-0", "-top-1", "-top-2", "-top-3", "-right-1", "-right-2", "-right-3",
    "sticky", "fixed", "absolute", "relative", "static",
    
    // Z-INDEX - ALLE Stufen
    "z-0", "z-10", "z-20", "z-30", "z-40", "z-50", "z-auto", "-z-10",
    
    // OVERFLOW - ALLE Variationen
    "overflow-hidden", "overflow-visible", "overflow-scroll", "overflow-auto",
    "overflow-x-hidden", "overflow-x-visible", "overflow-x-scroll", "overflow-x-auto",
    "overflow-y-hidden", "overflow-y-visible", "overflow-y-scroll", "overflow-y-auto",
    
    // CURSOR - ALLE Variationen
    "cursor-pointer", "cursor-default", "cursor-wait", "cursor-text", "cursor-move", "cursor-not-allowed", "cursor-help",
    
    // DISPLAY - ALLE Variationen
    "block", "inline-block", "inline", "flex", "inline-flex", "table", "table-cell", "grid", "hidden",
    
    // SPACE und GAP - ALLE Größen
    "space-x-0", "space-x-1", "space-x-2", "space-x-3", "space-x-4", "space-x-5", "space-x-6", "space-x-8", "space-x-12", "space-x-16",
    "space-y-0", "space-y-1", "space-y-2", "space-y-3", "space-y-4", "space-y-5", "space-y-6", "space-y-8", "space-y-12", "space-y-16",
    "gap-0", "gap-1", "gap-2", "gap-3", "gap-4", "gap-5", "gap-6", "gap-8", "gap-12", "gap-16",
    
    // LINE-HEIGHT und TRACKING
    "leading-none", "leading-tight", "leading-snug", "leading-normal", "leading-relaxed", "leading-loose",
    "tracking-tighter", "tracking-tight", "tracking-normal", "tracking-wide", "tracking-wider", "tracking-widest",
    
    // BORDER - ALLE Seiten und Größen
    "border", "border-0", "border-2", "border-4", "border-8",
    "border-t", "border-t-0", "border-t-2", "border-t-4",
    "border-r", "border-r-0", "border-r-2", "border-r-4",
    "border-b", "border-b-0", "border-b-2", "border-b-4",
    "border-l", "border-l-0", "border-l-2", "border-l-4",
    
    // BACKDROP und BLUR
    "backdrop-blur-none", "backdrop-blur-sm", "backdrop-blur", "backdrop-blur-md", "backdrop-blur-lg", "backdrop-blur-xl",
    "backdrop-filter", "backdrop-brightness-50", "backdrop-brightness-75", "backdrop-brightness-100", "backdrop-brightness-125",
    
    // GRADIENTS - ALLE Richtungen
    "bg-gradient-to-r", "bg-gradient-to-l", "bg-gradient-to-t", "bg-gradient-to-b", "bg-gradient-to-tr", "bg-gradient-to-tl", "bg-gradient-to-br", "bg-gradient-to-bl",
    "from-purple-600", "from-blue-600", "from-green-600", "from-red-600", "from-yellow-600", "from-pink-600",
    "to-purple-600", "to-blue-600", "to-green-600", "to-red-600", "to-yellow-600", "to-pink-600",
    "via-purple-600", "via-blue-600", "via-green-600", "via-red-600", "via-yellow-600", "via-pink-600",
    
    // TEXT DECORATION
    "underline", "no-underline", "line-through", "bg-clip-text", "text-transparent",
    "break-words", "break-all", "break-normal", "truncate", "text-ellipsis", "text-clip",
    "whitespace-normal", "whitespace-nowrap", "whitespace-pre", "whitespace-pre-line", "whitespace-pre-wrap",
    
    // INTERACTIVITY
    "pointer-events-none", "pointer-events-auto", "select-none", "select-text", "select-all", "select-auto",
    
    // VISIBILITY
    "visible", "invisible", "opacity-0", "opacity-25", "opacity-50", "opacity-75", "opacity-100",
    
    // CLAMP (für Textzeilen)
    "line-clamp-1", "line-clamp-2", "line-clamp-3", "line-clamp-4", "line-clamp-5", "line-clamp-6"
  ],

  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
