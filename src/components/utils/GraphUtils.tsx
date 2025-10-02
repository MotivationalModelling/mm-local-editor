import { Cell } from "@maxgraph/core";
import { SYMBOL_CONFIGS, SymbolKey, SymbolConfig } from './GraphConstants';

// Finds the symbol key (e.g. 'STAKEHOLDER') based on the type
export function getSymbolKeyByType(type: string): SymbolKey | undefined {
  return (Object.entries(SYMBOL_CONFIGS) as [SymbolKey, typeof SYMBOL_CONFIGS[SymbolKey]][])
    .find(([_, config]) => config.type === type)?.[0];
}

export const getSymbolConfigByShape = (shape: string): SymbolConfig | undefined => {
  return Object.values(SYMBOL_CONFIGS).find(config => config.shape === shape);
};



/**
 * Ensures that the cell's ID(s) are in the correct format:
 * - Format: "Functional-1,2,3" or "Nonfunctional-12,2,3"
 * - A cell ID may contain multiple numeric IDs separated by commas.
 * - If an ID is just a number, it will be automatically prefixed with the correct type.
 */
export function ensureCellIdFormat(cell: Cell): Cell {
  const cellId = cell.getId();

  const goalTypeRaw = getSymbolConfigByShape(String(cell.style.shape))?.type;
  const functionalType = goalTypeRaw === "Functional" ? "Functional" : "Nonfunctional";

  if (!cellId) {
    // Generate a new ID if none exists
    const newId = `${functionalType}-${Date.now()}`;
    cell.setId(newId);
    return cell;
  }

  // Split by comma and normalize each part
  const parts = cellId.split(",").map(p => p.trim()).filter(p => p.length > 0);
  const numericIds: number[] = parts.map(part => {
    const match = part.match(/^(Functional|Nonfunctional)-?(-?\d+)$/);
    if (match) return Number(match[2]);
    else if (/^-?\d+$/.test(part)) return Number(part);
    else throw new Error(`Invalid cell ID format: ${part}`);
  });

  // Join numeric IDs with comma, only first one has prefix
  const newId = `${functionalType}-${numericIds.join(",")}`;
  cell.setId(newId);
  return cell;
}

/**
 * Extracts numeric ID(s) from a cell:
 * - Supports multiple comma-separated IDs in format: "Functional-1,2,3"
 * - Returns an array of numbers, e.g. [1, 2, 3]
 */
export function getCellNumericIds(cell: Cell): number[] {
  // Ensure cell ID is normalized
  ensureCellIdFormat(cell);

  const cellId = cell.getId();
  if (!cellId) return [];

  // Remove prefix and split by comma
  const match = cellId.match(/^(Functional|Nonfunctional)-(.+)$/);
  if (!match) return [];

  return match[2]
    .split(",")
    .map(s => Number(s.trim()))
    .filter(n => !isNaN(n));
}



// Utility function to return focus to graph container
// This enables keyboard shortcuts after save/export operations
export const returnFocusToGraph = () => {
    const graphContainer = document.getElementById('graphContainer');
    if (graphContainer) {
        graphContainer.focus();
    }
};
