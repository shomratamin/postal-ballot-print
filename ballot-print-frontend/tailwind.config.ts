import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    colors: {
      current: "currentColor",
      transparent: "transparent",
      white: "#FFFFFF",
      black: "#000000",
      postEnvelopeOne: "#fae1ca",
      postLightest: "#F4F4F5",
      postLighter: "rgb(244, 244, 245)",
      postLight: "#e4e4e7",
      postBorder: "rgba(17, 17, 17, 0.15)",
      postBorderDark: "rgba(255, 255, 255, 0.15)",
      postBorderOpaque: "rgb(228, 228, 231, .6)",
      postDark: "#71717A",
      postDarker: "#232326",
      postDarkest: "#18181B",
      postEnvelope: "#facba0",
      postRed: "#C41C22",
      postGreenLighter: "rgb(18, 161, 80)",
      postGreen: "#006A4E",
      postGreenLight: "#18C964",
      postGreenLightest: "rgb(23,201,100,.25)",
      postGreenDark: "#00442D",
      postRedDark: "#B00F0A",
      postRedLight: "#D5170F",
      postBlue: "#1E3A8A",
      postBlueLight: "#3B82F6",
      pdfLight: "rgb(238, 238, 238)",
      pdfLightHover: "rgba(0, 0, 0, 0.1)",
      pdfDark: "#091139",
      pdfDarker: "#090e34",
      pdfDarkHover: "#090e34",
      dgenYellow: "#f8ff00",
      dgenLight: "rgb(238, 238, 238)",
      dgenLightHover: "rgba(0, 0, 0, 0.1)",
      dgenDark: "#091139",
      dgenDarkBorder: "rgba(236, 237, 238, .2)",
      dgenDarker: "#090e34",
      dgenDarkest: "#060a23",
      dgenDarkHover: "#090e34",
      dgenBlueLight: "#22d3ee",
      sidebarBg: "#f2f4f8",

      slate: {
        50: "#f8fafc",
        100: "#f1f5f9",
        200: "#e2e8f0",
        300: "#cbd5e1",
        400: "#94a3b8",
        500: "#64748b",
        600: "#475569",
        700: "#334155",
        800: "#1e293b",
        900: "#0f172a",
      },

      gray: {
        50: "#FAFAFA",
        100: "#F7FAFC",
        200: "#EDF2F7",
        300: "#E2E8F0",
        400: "#CBD5E0",
        500: "#A0AEC0",
        600: "#718096",
        700: "#4A5568",
        800: "#2D3748",
        900: "#1A202C",
      },

      red: {
        50: "#FDE8E8",
        100: "#FBCFCF",
        200: "#F79E9E",
        300: "#F26666",
        400: "#EB3B3B",
        500: "#DC2626", // primary red
        600: "#B91C1C",
        700: "#991B1B",
        800: "#7F1D1D",
        900: "#651919",
      },
      error: {
        50: "#FDE8E8",
        100: "#FBCFCF",
        200: "#F79E9E",
        300: "#F26666",
        400: "#EB3B3B",
        500: "#DC2626", // primary red
        600: "#B91C1C",
        700: "#991B1B",
        800: "#7F1D1D",
        900: "#651919",
      },
      green: {
        50: "#f0fdf4",
        100: "#dcfce7",
        200: "#bbf7d0",
        300: "#86efac",
        400: "#4ade80",
        500: "#22c55e",
        600: "#16a34a",
        700: "#15803d",
        800: "#166534",
        900: "#14532d",
      },

      yellow: {
        50: "#fefce8",
        100: "#fef9c3",
        200: "#fef08a",
        300: "#fde047",
        400: "#facc15",
        500: "#eab308",
        600: "#ca8a04",
        700: "#a16207",
        800: "#854d0e",
        900: "#713f12",
      },

      success: {
        50: "#D9FBE6",
        100: "#B7FFD1",
        200: "#4ADE80",
        300: "#22C55E",
        400: "#16A34A",
        500: "#16A34A",
      },
      blue: {
        50: "#e6f1fe",
        100: "#cce3fd",
        200: "#99c7fb",
        300: "#66aaf9",
        400: "#338ef7",
        500: "#006FEE",
        600: "#005bc4",
        700: "#004493",
        800: "#002e62",
        900: "#001731",
      },


      amber: {
        50: "#FFFBEB",
        100: "#FEF3C7",
        200: "#FDE68A",
        300: "#FCD34D",
        400: "#FBBF24",
        500: "#F59E0B",
        600: "#D97706",
        700: "#B45309",
        800: "#92400E",
        900: "#78350F",
      },

      teal: {
        50: "#f0fdfa",
        100: "#ccfbf1",
        200: "#99f6e4",
        300: "#5eead4",
        400: "#2dd4bf",
        500: "#14b8a6",
        600: "#0d9488",
        700: "#0f766e",
        800: "#115e59",
        900: "#134e4a",
      },




      cyan: {
        50: "#ecfeff",
        100: "#cffafe",
        200: "#a5f3fc",
        300: "#67e8f9",
        400: "#22d3ee",
        500: "#06b6d4",
        600: "#0891b2",
        700: "#0e7490",
        800: "#155e75",
        900: "#164e63",
      },

      bamber: {
        50: "#FFFBEB",
        100: "#FFC837",
        500: "#F6A723",
      },
      purple: {
        50: "#F4EBFF",
        100: "#E1D5FF",
        200: "#C7B3FF",
        300: "#A98EFF",
        400: "#936DFF", // your primary purple
        500: "#7B51F6",
        600: "#643BD4",
        700: "#512FB0",
        800: "#3F248C",
        900: "#2D1A69",
      },

      indigo: {
        50: "#EEF2FF",
        100: "#E0E7FF",
        200: "#C7D2FE",
        300: "#A5B4FC",
        400: "#818CF8", // your primary indigo
        500: "#6366F1",
        600: "#4F46E5",
        700: "#4338CA",
        800: "#3730A3",
        900: "#312E81",
      },

      orange: {
        50: "#FFF3E0",
        100: "#FFE0B2",
        200: "#FFCC80",
        300: "#FFB74D",
        400: "#FFA726",
        500: "#FF9800",
        600: "#FB8C00",
        700: "#F57C00",
        800: "#EF6C00",
        900: "#E65100",
      },

      emerald: {
        50: "#ecfdf5",
        100: "#d1fae5",
        200: "#a7f3d0",
        300: "#6ee7b7",
        400: "#34d399",
        500: "#10b981",
        600: "#059669",
        700: "#047857",
        800: "#065f46",
        900: "#064e3b",
      }







    },




    gray: {
      50: "#FAFAFA",
      100: "#F7FAFC",
      200: "#EDF2F7",
      300: "#E2E8F0",
      400: "#CBD5E0",
      500: "#A0AEC0",
      600: "#718096",
      700: "#4A5568",
      800: "#2D3748",
      900: "#1A202C",
    },

    success: {
      50: "#D9FBE6",
      100: "#B7FFD1",
      200: "#4ADE80",
      300: "#22C55E",
      400: "#16A34A",
      500: "#16A34A",
    },
    // warning: {
    //   100: "#FDE047",
    //   200: "#FACC15",
    //   300: "#EAB308",
    // },
    error: {
      50: "#FCDEDE",
      100: "#FF7171",
      200: "#FF4747",
      300: "#DD3333",
    },

    slate: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },

    red: {
      50: "#FDE8E8",
      100: "#FBCFCF",
      200: "#F79E9E",
      300: "#F26666",
      400: "#EB3B3B",
      500: "#DC2626", // primary red
      600: "#B91C1C",
      700: "#991B1B",
      800: "#7F1D1D",
      900: "#651919",
    },


    lime: {
      50: "#f7fee7",
      100: "#ecfccb",
      200: "#d9f99d",
      300: "#bef264",
      400: "#a3e635",
      500: "#84cc16",
      600: "#65a30d",
      700: "#4d7c0f",
      800: "#3f6212",
      900: "#365314",
    },

    blue: {
      50: "#e6f1fe",
      100: "#cce3fd",
      200: "#99c7fb",
      300: "#66aaf9",
      400: "#338ef7",
      500: "#006FEE",
      600: "#005bc4",
      700: "#004493",
      800: "#002e62",
      900: "#001731",
    },
  
    

  teal: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
  }
  ,

  zinc: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
  }
  ,


  amber: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },

  primary: "#006FEE",
  secondary: "#7828c8",
  warning: "#f5a524",
  // orange: "#FF784B",
  bamber: {
    50: "#FFFBEB",
    100: "#FFC837",
    500: "#F6A723",
  },
  primaryNew: "#B7FFD1",
  // primary: "#22C55E",
  primaryBase: "#22C55E",
  portage: "#936DFF",
  basicInterface: "#04091E",
  basicInterface2: "#F5F5F5",
  basicInterface3: "#747681",
  basicWhite: "#747681",
  lightGray: "#F3F7F8",
  alertsWarningLight: "#FDE047",
  alertsWarningBase: "#FACC15",
  stockColor: "#CBCBCB",
  "primary-new": "#B7FFD1",
  alertsErrorBase: "#FF4747",





  /* Add these styles to your global styles or Tailwind CSS configuration file */

  screens: {
    ss: "300px",
    // => @media (min-width: 400px) { ... }

    xxs: "380px",
    // => @media (min-width: 400px) { ... }

    xs: "450px",
    // => @media (min-width: 450px) { ... }

    sm: "575px",
    // => @media (min-width: 576px) { ... }

    md: "768px",
    // => @media (min-width: 768px) { ... }

    lg: "992px",
    // => @media (min-width: 992px) { ... }

    xl: "1200px",
    // => @media (min-width: 1200px) { ... }

    "2xl": "1400px",
    // => @media (min-width: 1400px) { ... }
  },
  extend: {

  },
},
  plugins: [heroui({
    defaultTheme: "light",
  })],
};
export default config;
