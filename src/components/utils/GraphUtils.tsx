import {ClusterGoal, createInstanceId, GoalBase, TreeGoal, InstanceId, INSTANCE_ID_SEPARATOR} from '../types';
import {SYMBOL_CONFIGS, SymbolKey, SymbolConfig} from './GraphConstants';
import {Graph, Cell} from '@maxgraph/core';

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
 * - Supports multiple comma-separated IDs like: "Nonfunctional-[5:1,1762312908316:1]"
 * - Returns an array of strings, e.g. ["5:1", "1762312908316:1"]
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
    observer.observe(container, {childList: true, subtree: true});
}

// Functional-8:1
export function formatFunGoalRefId(goal: ClusterGoal) {
    return `${goal.GoalType}-${goal.instanceId}`;
}

export const parseFuncGoalRefId = (id: string): {goalId: TreeGoal["id"], instanceId: InstanceId} => {
    // A graph cell keeps its type outside the canonical instance ID, e.g. Functional-2:1.
    try {
        const instanceId = validateInstanceId(id);
        const {goalId} = parseInstanceId(instanceId);

        return {goalId, instanceId};
    } catch {
        throw new Error(`invalid InstanceId: got "${id}"`);
    }
};

export const parseNonFuncGoalRefId = (id: string): {goalId: TreeGoal["id"], instanceId: InstanceId}[] => {
    // Eg, Nonfunctional-[2:1,1762225479581:1] -> [2:1,1762225479581:1]
    const match = id.match(/^\[(.+)]$/);
    if (!match) {
        throw new Error(`invalid nonfunctional id: got "${id}"`);
    }

    const inner = match[1];
    const pairs = inner.split(",")
                               .map((s) => s.trim())
                               .map((pair) => parseFuncGoalRefId(pair));

    return pairs;
};

// Convert the cell id in MaxGraph 'Functional-8:1'
export const parseGoalRefId = (refId: string): {goalId: TreeGoal["id"], instanceId: InstanceId}[] => {
    if (!refId) {
        throw new Error("cell id is missing");
    }

    const n = refId.indexOf('-');
    if (n < 0) {
        throw new Error(`malformed cell id "${refId}"`);
    }
    const [typePart, idPart] = [refId.slice(0, n), refId.slice(n + 1)];
    const type = typePart.trim();

    switch (type) {
    case "Functional":
        try {
            return [parseFuncGoalRefId(idPart)];    // always return as a list
        } catch (error) {
            throw Error(`invalid functional goal: "${refId}"`);
        }
    case "Nonfunctional":
        try {
            return parseNonFuncGoalRefId(idPart);
        } catch (error) {
            throw Error(`invalid non-functional goal: "${refId}"`);
        }
    default:
        throw new Error(`unrecognised goal type "${type}"`);
    }
};


// Treeid stored in the state '8:1'
export function getRefIdFromInstanceId(instanceId: InstanceId) {
    return parseInstanceId(instanceId).refId;
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

// New state uses the configured separator; the legacy pattern is accepted only while stored/imported models are normalised.
const INSTANCE_ID_RE = new RegExp(`^(-?\\d+)${INSTANCE_ID_SEPARATOR}(\\d+)$`);
const LEGACY_INSTANCE_ID_RE = /^(-?\d+)-(\d+)$/;

export const validateInstanceId = (id: string): InstanceId => {
    if (!INSTANCE_ID_RE.test(id)) {
        throw new Error(`badly formatted instanceId "${id}"`);
    }
    return id as InstanceId;
};

export const parseInstanceId = (instanceId: InstanceId) => {
    const match = INSTANCE_ID_RE.exec(instanceId);
    if (!match) {
        throw new Error(`badly formatted instanceId "${instanceId}"`);
    }

    return {
        goalId: Number(match[1]),
        refId: Number(match[2]),
    };
};

export const normalizeInstanceId = (instanceId: string): InstanceId => {
    const match = INSTANCE_ID_RE.exec(instanceId) ?? LEGACY_INSTANCE_ID_RE.exec(instanceId);
    if (!match) {
        throw new Error(`badly formatted instanceId "${instanceId}"`);
    }

    return createInstanceId(Number(match[1]), Number(match[2]));
};

// Check and retrieve if the non-functional goal has pre-defined color by instanceId
export const getNonFunctionalGoalColor = (
    clusterGoals: ClusterGoal[],
    nonFunctionGoals: {instanceId: InstanceId; content: string;}[],
): string | undefined => {
    const instanceId = nonFunctionGoals[0].instanceId;
    const goal = findGoalbyInstanceId(clusterGoals, instanceId);

    return goal?.GoalColor;
};

const findGoalbyInstanceId = (clusterGoals: ClusterGoal[], instanceId: InstanceId): GoalBase | undefined => {
    return clusterGoals.find((goal) => goal.instanceId === instanceId);
};

export function makeLabelForGoalType (items: Array<string>, type: SymbolKey | undefined): string {
    const sep = (type === 'STAKEHOLDER') ? ",\n" : ", ";

    return makeSquareLabel(items, sep);
}

function makeSquareLabel(items: string[], sep = ", "): string {
    const n = items.length;

    if (n === 0) {
        return "";
    }

    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const lines: string[] = [];

    for (let r = 0; r < rows; r++) {
        const slice = items.slice(r * cols, (r + 1) * cols);
        lines.push(slice.join(sep));
    }

    return lines.join(",\n");
}

    export const isTypeAdjustableByText = (symbolKey: SymbolKey | undefined) => (symbolKey !== "STAKEHOLDER" && symbolKey !== "CROWD");
