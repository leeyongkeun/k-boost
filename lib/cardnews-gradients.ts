export interface GradientPreset {
  background: string;
  textColor: string;
  accentColor: string;
}

export const GRADIENTS: Record<string, GradientPreset> = {
  navy_red: {
    background: "linear-gradient(135deg, #010e2a 0%, #0a2a6b 50%, #1a0a2e 100%)",
    textColor: "#ffffff",
    accentColor: "#C50337",
  },
  deep_ocean: {
    background: "linear-gradient(135deg, #0c2340 0%, #1a5276 50%, #148f77 100%)",
    textColor: "#ffffff",
    accentColor: "#48c9b0",
  },
  sunset_coral: {
    background: "linear-gradient(135deg, #2c1654 0%, #8e3050 50%, #d4556b 100%)",
    textColor: "#ffffff",
    accentColor: "#f5b7b1",
  },
  royal_gold: {
    background: "linear-gradient(135deg, #1a1a2e 0%, #3d2c5e 50%, #7b5ea7 100%)",
    textColor: "#ffffff",
    accentColor: "#f9e547",
  },
  forest_green: {
    background: "linear-gradient(135deg, #0b3d2e 0%, #1e6f50 50%, #2ecc71 100%)",
    textColor: "#ffffff",
    accentColor: "#a9dfbf",
  },
  warm_earth: {
    background: "linear-gradient(135deg, #1c1107 0%, #5d3a1a 50%, #b7791f 100%)",
    textColor: "#ffffff",
    accentColor: "#fbd38d",
  },
  arctic_blue: {
    background: "linear-gradient(135deg, #0a1628 0%, #1e3a5f 50%, #3498db 100%)",
    textColor: "#ffffff",
    accentColor: "#85c1e9",
  },
  cherry_blossom: {
    background: "linear-gradient(135deg, #2d1b33 0%, #6b3a5e 50%, #c97b9b 100%)",
    textColor: "#ffffff",
    accentColor: "#f5cee8",
  },
  midnight_sky: {
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    textColor: "#ffffff",
    accentColor: "#a29bfe",
  },
  flame_red: {
    background: "linear-gradient(135deg, #1a0000 0%, #8b1a1a 50%, #C50337 100%)",
    textColor: "#ffffff",
    accentColor: "#ff6b6b",
  },
};

const GRADIENT_KEYS = Object.keys(GRADIENTS);

export function getGradient(index: number): GradientPreset {
  return GRADIENTS[GRADIENT_KEYS[index % GRADIENT_KEYS.length]];
}

export function getGradientKey(index: number): string {
  return GRADIENT_KEYS[index % GRADIENT_KEYS.length];
}
