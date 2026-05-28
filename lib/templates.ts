export interface ResumeThemeConfig {
  typography: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
  };
  colors: {
    accent: string;
    text: string;
    background: string;
  };
  layout: {
    margins: string;
    sectionSpacing: string;
  };
}

export const defaultThemeConfig: ResumeThemeConfig = {
  typography: {
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    lineHeight: "1.5",
  },
  colors: {
    accent: "#3b82f6", // Blue
    text: "#171717",
    background: "#ffffff",
  },
  layout: {
    margins: "57px", // Standard A4 margins
    sectionSpacing: "16px",
  },
};

export interface ResumeTemplate {
  id: string;
  name: string;
  category: "ATS Friendly" | "Modern" | "Minimal" | "Developer" | "Creative" | "Academic";
  atsFriendly: boolean;
  thumbnail: string;
  description: string;
}

export const availableTemplates: ResumeTemplate[] = [
  {
    id: "velora-professional",
    name: "Velora Professional",
    category: "ATS Friendly",
    atsFriendly: true,
    thumbnail: "/templates/velora-professional-cover.png",
    description: "The classic, industry-standard ATS-friendly template perfect for corporate roles.",
  },
  {
    id: "modern-minimalist",
    name: "Modern Minimalist",
    category: "Minimal",
    atsFriendly: true,
    thumbnail: "/templates/modern-minimalist-cover.png",
    description: "Clean, spacious design with a focus on typography and whitespace.",
  },
  {
    id: "dev-terminal",
    name: "Dev Terminal",
    category: "Developer",
    atsFriendly: false,
    thumbnail: "/templates/dev-terminal-cover.png",
    description: "A dark-mode, monospaced template for software engineers who love the CLI.",
  },
  {
    id: "creative-accent",
    name: "Creative Accent",
    category: "Creative",
    atsFriendly: false,
    thumbnail: "/templates/creative-accent-cover.png",
    description: "Bold accent colors and modern layouts for designers and creatives.",
  }
];
