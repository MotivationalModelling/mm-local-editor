import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {
    createTabDataFromTabs,
    createTreeIdsFromTreeData,
} from "./FileProvider.tsx";
import {InstanceId, Label, TabContent, TreeGoal} from "../types.ts"
import {InitialTab, initialTabs} from "../../data/initialTabs.ts";
import {parseInstanceId} from "../utils/GraphUtils.tsx";


// Create a new TreeGoal node for the tree (without content/type - those are in goals)
export const createTreeGoalNode = (
    treeIds: Record<TreeGoal["id"], InstanceId[]>,
    {
        id,
        instanceId = generateInstanceId(treeIds, id),
        children = [],
        content = "",
        type,
        color,
    }: {
        id: TreeGoal["id"];
        instanceId?: InstanceId;
        children?: TreeGoal[];
        content?: string;
        type: TreeGoal["type"];
        color?: string;
    },
): TreeGoal => {
    // Update treeIds mapping
    if (treeIds[id]) {
        treeIds[id].push(instanceId);
    } else {
        treeIds[id] = [instanceId];
    }

    return {
        id,
        instanceId,
        children,
        content,
        type,
        color,
    };
};

/** @deprecated Use createTreeGoalNode instead */
export const newTreeNode = createTreeGoalNode;


/** @deprecated No longer needed - tree now stores TreeGoal directly */
export const createTreeFromTreeData = (treeData: TreeGoal[]): TreeGoal[] => treeData;

export const createTabContentFromInitialTab = ({label, icon, rows}: InitialTab): TabContent => ({
    label,
    icon,
    goalIds: rows.map((goal) => goal.id)
});

const createGoalsAndTabsFromTabContent = (initialTabs: InitialTab[]): {
    tabs: Map<Label, TabContent>,
    goals: Record<TreeGoal["id"], TreeGoal>
} => {
    const tabs: Map<Label, TabContent> = new Map(initialTabs.map((tab) => [tab.label, createTabContentFromInitialTab(tab)]));
    const allGoals = initialTabs.map((tab) => tab.rows).flat();
    const goals = Object.fromEntries(allGoals.map((goal) => [goal.id, goal]));

    return {goals, tabs};
};

// remove each item from tree
export const removeItemIdFromTree = (
    items: TreeGoal[],
    id: TreeGoal["id"],
    instanceId?: InstanceId,
    removeChildren: boolean = true
): TreeGoal[] => {
    return items.reduce((acc, item) => {
        if (item.id === id && item.instanceId === instanceId) {

            if (!removeChildren && item.children) {
                // Promote children to parent level
                acc.push(...item.children);
            }
            return acc; // skip this item
        }

        if (item.children) {
            item.children = removeItemIdFromTree(item.children, id, instanceId, removeChildren);
        }

        acc.push(item);
        return acc;
    }, [] as TreeGoal[]);
};

export const removeItemIdFromTabs = (tabs: TabContent[], id: TreeGoal["id"]): TabContent[] => {
    return tabs.map((tab) => ({
        ...tab,
        goalIds: tab.goalIds.filter((goalId) => (goalId !== id))
    }));
};

const removeAllReferenceFromHierarchy = (
    tree: TreeGoal[],
    goalId: TreeGoal["id"],
    instanceId?: InstanceId,
): TreeGoal[] => {
    return tree
        .filter(node => {
            if (instanceId !== undefined) {
                // keep nodes that are not this specific instance
                return !(node.id === goalId && node.instanceId === instanceId);
            } else {
                // keep nodes that do not match the goalId
                return node.id !== goalId;
            }
        })
        .map(node => ({
            ...node,
            children: node.children
                ? removeAllReferenceFromHierarchy(node.children, goalId, instanceId)
                : []
        }));
};

const generateMaxSuffix = (treeIds: Record<TreeGoal["id"], InstanceId[]>, goalId: TreeGoal["id"]): number => {
    const ids = treeIds[goalId]?.filter((id) => id !== null);  // filter out undefined & null
    if (!ids || ids.length === 0) return 0;
    return Math.max(
        ...ids.map((id) => parseInstanceId(id).refId)
    );
};


const generateInstanceId = (treeIds: Record<TreeGoal["id"], InstanceId[]>, goalId: TreeGoal["id"]): InstanceId => {
    // give it new instance id
    const maxSuffix = generateMaxSuffix(treeIds, goalId) + 1;
    return `${goalId}-${maxSuffix}`
};

//
export const createInitialState = (tabData: InitialTab[] = initialTabs, treeData: TreeGoal[] = []) => {

    const {goals, tabs} = createGoalsAndTabsFromTabContent(tabData);

    // console.log("createInitialState", tabContent, goals, tabs);
    return {
        tabs,
        goals,
        tree: treeData,  // No conversion needed - tree now stores TreeGoal directly
        treeIds: createTreeIdsFromTreeData(treeData),
    };
};

export const findTreeGoalByInstanceId = (nodes: TreeGoal[], instanceId: InstanceId): TreeGoal | undefined => {
    for (const node of nodes) {
        if (node.instanceId === instanceId) {
            return node;
        }
        const matchingNode = findTreeGoalByInstanceId(node.children ?? [], instanceId);
        if (matchingNode) {
            return matchingNode;
        }
    }
    return undefined;
};

/** @deprecated Use findTreeGoalByInstanceId instead */
export const findTreeNodeByInstanceId = findTreeGoalByInstanceId;

export const treeDataSlice = createSlice({
    name: "treeData",
    initialState: {
        tree: [] as TreeGoal[],
        tabs: {} as Map<Label, TabContent>,
        goals: {} as Record<TreeGoal["id"], TreeGoal>,
        treeIds: {} as Record<TreeGoal["id"], InstanceId[]>
    },
    reducers: {
        addGoal(state, action: PayloadAction<TreeGoal>) {
            state.goals[action.payload.id] = action.payload;
            state.tabs.get(action.payload.type)?.goalIds.push(action.payload.id);
        },
        addGoalToTab: (state, action: PayloadAction<TreeGoal>) => {
            state.tabs.get(action.payload.type)?.goalIds.push(action.payload.id);
            state.goals[action.payload.id] = action.payload;
        },
        setTreeData: (state, action: PayloadAction<TreeGoal[]>) => {
            state.tree = action.payload;  // No conversion needed
        },
        addGoalToTree: (state, action: PayloadAction<TreeGoal>) => {
            // Create a TreeGoal node with generated instanceId
            const instanceId = generateInstanceId(state.treeIds, action.payload.id);
            if (state.treeIds[action.payload.id]) {
                state.treeIds[action.payload.id].push(instanceId);
            } else {
                state.treeIds[action.payload.id] = [instanceId];
            }
            const node: TreeGoal = {
                ...action.payload,
                instanceId,
                children: [],
            };
            state.tree.push(node);
        },
        // remove goal(s) and its children from canvas
        removeGoalIdFromTree: (state, action: PayloadAction<{
            id: TreeGoal["id"],
            instanceId: InstanceId
            removeChildren: boolean
        }>) => {
            state.tree = removeItemIdFromTree(state.tree, action.payload.id, action.payload.instanceId, action.payload.removeChildren);
        },
        // delete it will also delete the reference in the tree
        deleteGoalFromGoalList: (state, action: PayloadAction<TreeGoal>) => {
            const tabContent = state.tabs.get(action.payload.type);
            if (tabContent) {
                tabContent.goalIds = tabContent.goalIds.filter((id) => id !== action.payload.id);
            }
            delete state.goals[action.payload.id];
            // remove it and its reference
            state.tree = removeAllReferenceFromHierarchy(state.tree, action.payload.id, undefined)
            delete state.treeIds[action.payload.id];
        },
        // delete it will not affect the orginal and other reference
        deleteGoalReferenceFromHierarchy: (state, action: PayloadAction<TreeGoal>) => {
            // only itself
            state.tree = removeAllReferenceFromHierarchy(state.tree, action.payload.id, action.payload.instanceId)
            state.treeIds[action.payload.id] = state.treeIds[action.payload.id].filter(node => node !== action.payload.instanceId);
        },

        updateTextForGoalId: (state, action: PayloadAction<{
            id: TreeGoal["id"],
            text: string
        }>) => {
            state.goals[action.payload.id] = {
                ...state.goals[action.payload.id],
                content: action.payload.text
            };
        },
        updateTextForInstanceId: (state, action: PayloadAction<{
            instanceId: string,  // Accept string for compatibility with getCellNumericIds
            text: string
        }>) => {
            const {instanceId, text} = action.payload;
            const goalId = parseInstanceId(instanceId).goalId;
            state.goals[goalId] = {
                ...state.goals[goalId],
                content: text
            };
        },
        updateColorForInstanceId: (state, action: PayloadAction<{
            instanceId: string,  // Accept string for compatibility
            color: string
        }>) => {
            const {instanceId, color} = action.payload;
            const goalId = parseInstanceId(instanceId).goalId;
            const node = findTreeGoalByInstanceId(state.tree, instanceId as InstanceId);
            if (node?.id === goalId) {
                node.color = color;
            }
        },
        reset: (state, action: PayloadAction<{
            tabData: InitialTab[],
            treeData: TreeGoal[]
        } | undefined>) => {
            const initialState = (action.payload) ? createInitialState(action.payload.tabData, action.payload.treeData)
                : createInitialState(initialTabs, []);
            Object.assign(state, initialState);
        }
    },
    extraReducers: (builder) => {
        // XXX after every action, update copy in localstorage
        builder
            .addMatcher(() => true, (state) => {
                // onChange.?(state)
            })
    },
    selectors: {
        selectTabData: (state) => createTabDataFromTabs(state.goals, state.tabs),
        selectTreeData: (state) => state.tree,  // No conversion needed - tree is already TreeGoal[]
        selectGoalsForLabel: (state, label: Label) => state.tabs.get(label)?.goalIds.map((goalId) => state.goals[goalId]) ?? []
    }
});

export const {addGoal, addGoalToTab, setTreeData, addGoalToTree, deleteGoalReferenceFromHierarchy, deleteGoalFromGoalList, updateTextForGoalId, reset, removeGoalIdFromTree, updateTextForInstanceId, updateColorForInstanceId} = treeDataSlice.actions;
export const {selectGoalsForLabel} = treeDataSlice.selectors;

