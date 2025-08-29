import localFont from "next/font/local";

// Focal Sans-Serif Font Family
export const focal = localFont({
  src: [
    {
      path: "../../public/fonts/focal/Focal-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/focal/Focal-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/fonts/focal/Focal-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/focal/Focal-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/focal/Focal-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/focal/Focal-MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../public/fonts/focal/Focal-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/focal/Focal-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-focal",
  display: "swap",
});

// HAL Serif Font Family
export const hal = localFont({
  src: [
    {
      path: "../../public/fonts/hal/HALTimezone-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/hal/HALTimezone-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-hal",
  display: "swap",
});

// HAL Mono Font
export const halMono = localFont({
  src: "../../public/fonts/hal/HALTimezone-MonoRegular.woff2",
  variable: "--font-hal-mono",
  display: "swap",
});

// Commit Mono Font Family
export const commitMono = localFont({
  src: [
    {
      path: "../../public/fonts/commit/CommitMono-400-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/commit/CommitMono-600-Regular.otf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-commit-mono",
  display: "swap",
});

export const inconsolata = commitMono;
