// GraphConstants.ts
// Centralized constants and types for graph rendering and styling in the application.

// --- Default Element Dimensions ---
export const LINE_SIZE = 50;             // Line length between nodes
export const SYMBOL_WIDTH = 145;         // Base width of a symbol node
export const SYMBOL_HEIGHT = 110;        // Base height of a symbol node

// --- Vertex Font Styling ---
export const VERTEX_FONT = {
  size: 16,                              // Font size for text labels inside nodes
  color: "black",                        // Default font color
  scaleHeight: 2.375,                    //scale factor for height base on font size
} as const;

// --- Valid Symbol Keys ---
// These keys correspond to each supported symbol type in the diagram.
export type SymbolKey = 'FUNCTIONAL' | 'EMOTIONAL' | 'NEGATIVE' | 'QUALITY' | 'STAKEHOLDER';

// --- Symbol Configuration Interface ---
// Each symbol type includes its visual representation and metadata.
export interface SymbolConfig {
  type: string;                          // Display name of the symbol
  shape: string;                         // Custom shape name used by mxGraph or renderer
  imagePath: string;                     // Image file path used for rendering the symbol
  scale: {                               // Width and height scale factors (relative to base dimensions)
    width: number;
    height: number;
  };
  label: string;
}

// --- Symbol Configuration Map ---
// A unified definition for all available symbol types.
export const SYMBOL_CONFIGS: Record<SymbolKey, SymbolConfig> = {
  FUNCTIONAL: {
    type: "Functional",
    shape: "parallelogramShape",
    imagePath: "img/Function.png",
    scale: { width: 1.045, height: 0.8 },
    label: "Do",
  },
  EMOTIONAL: {
    type: "Emotional",
    shape: "heartShape",
    imagePath: "img/Heart.png",
    scale: { width: 0.9, height: 0.96 },
    label: "Feel",
  },
  NEGATIVE: {
    type: "Negative",
    shape: "negativeShape",
    imagePath: "img/Risk.png",
    scale: { width: 0.9, height: 0.96 },
    label: "Concern",
  },
  QUALITY: {
    type: "Quality",
    shape: "cloudShape",
    imagePath: "img/Cloud.png",
    scale: { width: 1, height: 0.8 },
    label: "Be",
  },
  STAKEHOLDER: {
    type: "Stakeholder",
    shape: "personShape",
    imagePath: "img/Stakeholder.png",
    scale: { width: 1, height: 1.2 },
    label: "Who",
  },
};

// --- Additional Assets ---
// Path to the default line image used in the diagram.
export const LINE_IMAGE_PATH = "img/line.svg";