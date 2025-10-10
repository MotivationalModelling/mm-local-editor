import {Cell} from "@maxgraph/core";
import {SYMBOL_CONFIGS, SymbolKey, SymbolConfig} from './GraphConstants';
import {ClusterGoal, ParsedFunctionalId, ParsedNonFunctionalId} from "../types.ts";


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
 * - Supports multiple comma-separated IDs like: "Functional-123-1,123-2,123-3"
 * - Returns an array of strings, e.g. ["123-1", "123-2", "123-3"]
 */
export function getCellNumericIds(cell: Cell): string[] {
    const cellId = cell.getId();
    if (cellId) {
        const match = cellId.match(/^(Functional|Nonfunctional)-(.+)$/);
        if (match) {
            return match[2]
                .split(",")
                .map(s => s.trim())
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

// Functional-8-1
export function formatFuncGoalRefId(goal: ClusterGoal): string {
    return `${goal.GoalType}-${goal.instanceId}`;
}

export function formatNonFuncGoalRefId(descriptions: { instanceId: string; content: string }[]): string {
  const list = descriptions.map(d => d.instanceId).join(";");
  return `Nonfunctional-[${list}]`;
}

export function parseNonFunctionalId(idStr: string):ParsedNonFunctionalId {

  const inside = idStr.match(/\[(.*)\]/)?.[1];
  if (!inside) throw new Error(`Failed to extract contents from: ${idStr}`);

  const pairs = inside.split(";").map(instanceId => {
    const goalIdStr = instanceId.split("-")[0];
    const goalId = Number(goalIdStr.trim());
    if (isNaN(goalId)) {
      throw new Error(`Invalid sub-ID pair: ${instanceId}`);
    }
    return {goalId, instanceId};
  });

  return {type: "Nonfunctional", pairs};
}

// Convert the cell id in MaxGraph 'Functional-8-1'
export function parseFuncGoalRefId(idStr: string):ParsedFunctionalId{
    if (!idStr) throw new Error("Cell ID is missing.");

    const parts = idStr.split("-");
    if (parts.length < 3) {
        throw new Error(`Cell ID format is invalid: expected format "Type-GoalId-InstanceId", got "${idStr}".`);
    }
    const goalId = Number(parts[1].trim());
    if (isNaN(goalId)) {
        throw new Error(`Goal ID must be a number, got "${parts[1]}".`);
    }

    const instanceId = parts.slice(1).join("-");
    return {type: "Functional", goalId, instanceId};
}

// Treeid stored in the state '8-1'
export function getRefIdFromInstanceId(instanceId: string) {
    const parts = instanceId.split("-");
    const suffixStr = parts.pop();
    return Number(suffixStr);
}

export function getGoalIdFromInstanceId(instanceId: string) {
    const parts = instanceId.split("-");
    const prefixStr = parts.shift();
    return Number(prefixStr);
}