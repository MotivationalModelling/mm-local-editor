import {ClusterGoal} from '../types';
import {SYMBOL_CONFIGS, SymbolKey, SymbolConfig} from './GraphConstants';
import {Graph, Cell} from '@maxgraph/core';
import {TreeNode} from "../context/FileProvider.tsx";

// Finds the symbol key (e.g. 'STAKEHOLDER') based on the type
export function getSymbolKeyByType(type: string): SymbolKey | undefined {
    return (Object.entries(SYMBOL_CONFIGS) as [SymbolKey, typeof SYMBOL_CONFIGS[SymbolKey]][])
        .find(([_, config]) => config.type === type)?.[0];
}

export const getSymbolConfigByShape = (shape: string): SymbolConfig | undefined => {
    return Object.values(SYMBOL_CONFIGS).find(config => config.shape === shape);
};

/**
 * Extracts ID strings from a cell:
 * - Supports multiple comma-separated IDs like: "Nonfunctional-[5-1,1762312908316-1]"
 * - Returns an array of strings, e.g. ["5-1", "1762312908316-1"]
 */
export function getCellNumericIds(cell: Cell): string[] {
    const cellId = cell.getId();
    if (cellId) {
        const match = cellId.match(/^(Functional|Nonfunctional)-(.+)$/);
        if (match) {
            return match[2]
                .split(",")
                .map(s => s.replace(/[[\]\s]/g, ""))
                .filter(s => s.length > 0);
        } else {
            throw new Error(`badly formatted cellId "${cellId}"`);
        }
    }
    return [];
}

// Utility function to return focus to graph container
// This enables keyboard shortcuts after save/export operations
export const returnFocusToGraph = () => {
    const graphContainer = document.getElementById('graphContainer');
    if (graphContainer) {
        graphContainer.focus();
    }
};

/**
 * Keeps the inline text editor at the center of the cell.
 * Uses a MutationObserver to detect when `.mxCellEditor` is added to the DOM,
 * then adjusts its position and keyboard behavior (Enter = save)
 * without modifying mxGraph’s internal event listeners.
 */
export function fixEditorPosition(graph: Graph) {
    const container = graph.container as HTMLElement;
    container.style.position = 'relative';

    // Apply the correct position to the text editor element
    const updateEditor = (el: HTMLElement) => {
        el.style.position = 'absolute';
        el.style.transformOrigin = '0 0';
        el.style.zIndex = '10';
        if (el.parentElement !== container) {
            container.appendChild(el);
        }

        // Press "Enter" to save editing
        el.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();     // prevent press Enter to start a newline
                graph.stopEditing(false);
            }
        });
    };

    const findEditorEl = (): HTMLElement | null => {
        return (
            container.querySelector('.mxCellEditor') ||
            document.querySelector('.mxCellEditor')
        ) as HTMLElement | null;
    };

    const adjustOnce = () => {
        const el = findEditorEl();
        if (el) updateEditor(el);
    };

    const observer = new MutationObserver(() => adjustOnce());
    observer.observe(container, { childList: true, subtree: true });
}

// Functional-8-1
export function formatFunGoalRefId(goal: ClusterGoal): string {
    return `${goal.GoalType}-${goal.instanceId}`;
}

// Convert the cell id in MaxGraph 'Functional-8-1'
export function parseFuncGoalRefId(idStr: string) {

  if (!idStr) throw new Error("Cell ID is missing.");

  const [typePart] = idStr.split("-", 1);
  const type = typePart.trim();

  if (type === "Functional") {
    // Example: Functional-2-1
    // goalId = 2, instanceId = "2-1"
    const parts = idStr.split("-");
    if (parts.length < 3) {
      throw new Error(
        `Invalid Functional ID: expected "Functional-GoalId-InstanceId", got "${idStr}".`
      );
    }

    const goalId = Number(parts[1].trim());
    if (isNaN(goalId)) {
      throw new Error(`Goal ID must be a number, got "${parts[1]}".`);
    }

    // instanceId should include both goal and instance part
    const instanceId = `${parts[1].trim()}-${parts[2].trim()}`;
    return [{goalId, instanceId}];

  } else if (type === "Nonfunctional") {
    // Nonfunctional-[2-1,1762225479581-1]
    const match = idStr.match(/^Nonfunctional-\[(.+)\]$/);
    if (!match) {
      throw new Error(
        `Invalid Nonfunctional ID: expected "Nonfunctional-[goalId-instanceId,...]", got "${idStr}".`
      );
    }

    const inner = match[1];
    const pairs = inner.split(",").map(s => s.trim());

    return pairs.map(pair => {
      const [goalStr, instStr] = pair.split("-");
      const goalId = Number(goalStr);
      if (isNaN(goalId)) {
        throw new Error(`Goal ID must be a number, got "${goalStr}"`);
      }
      const instanceId = `${goalStr}-${instStr}`;
      return {goalId, instanceId};
    });
  }
};


// Treeid stored in the state '8-1'
export function getRefIdFromInstanceId(instanceId: TreeNode["instanceId"]) {
    const parts = instanceId.split("-");
    const suffixStr = parts.pop();
    return Number(suffixStr);
}

/*
 * Mapping from goal type to allowed ID type:
 * - "Functional" expects a single number, e.g., "Functional-1"
 * - "Nonfunctional" expects an array of numbers, e.g., "Nonfunctional-1,2,3"
 */
type IdsForType = {
    Functional: string
    Nonfunctional: string[]
}

export function generateCellId<T extends keyof IdsForType>(type: T, ids: IdsForType[T]): string {
    switch (type) {
    case "Functional":
        return `${type}-${ids}`;
    case "Nonfunctional":
         return `${type}-[${ids}]`;
    default:
        throw new Error(`Unexpected type: ${type}`);
    }
}

export const parseInstanceId = (instanceId: TreeNode["instanceId"]) => {
    const bits = instanceId.split("-").map(s => s.trim());
    if (bits.length !== 2) {
        throw new Error(`badly formatted instanceId "${instanceId}"`);
    }
    
    const [goalId, refId] = bits.map(Number);

    return {goalId, refId};
};
