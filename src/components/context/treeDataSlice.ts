import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {
    createTabDataFromTabs, createTreeDataFromTreeNode,
    createTreeIdsFromTreeData,
    Label,
    TabContent,
    TreeItem,
    TreeNode,
    newTreeItem
} from "./FileProvider.tsx";
import {InitialTab, initialTabs} from "../../data/initialTabs.ts";

export const newTreeNode = ({goalId, children = []}: {
    goalId: TreeItem["id"],
    children?: TreeNode[]
}) => ({
    goalId,
    children
});

export const createTreeFromTreeData = (treeData: TreeItem[]): TreeNode[] => {
    return treeData.map((ti) => ({
        goalId: ti.id,
        children: createTreeFromTreeData(ti.children ?? [])
    }));
};

export const createTabContentFromInitialTab = ({label, icon, rows}: InitialTab): TabContent => ({
    label,
    icon,
    goalIds: rows.map((goal) => goal.id)
});

const createGoalsAndTabsFromTabContent = (initialTabs: InitialTab[]): {
    tabs: Map<Label, TabContent>,
    goals: Record<TreeItem["id"], TreeItem>
} => {
    const tabs: Map<Label, TabContent> = new Map(initialTabs.map((tab) => [tab.label, createTabContentFromInitialTab(tab)]));
    
    // Recursively collect all goals including nested children
    const allGoals: TreeItem[] = [];
    const collectGoals = (goals: TreeItem[]) => {
        goals.forEach(goal => {
            allGoals.push(goal);
            if (goal.children && goal.children.length > 0) {
                collectGoals(goal.children);
            }
        });
    };
    
    // Collect goals from all tabs
    initialTabs.forEach(tab => {
        collectGoals(tab.rows);
    });
    
    const goals = Object.fromEntries(allGoals.map((goal) => [goal.id, goal]));

    return {goals, tabs};
};

export const removeItemIdFromTree = (items: TreeNode[], id: TreeNode["goalId"]): TreeNode[] => {
    return items.reduce((acc, item) => {
        if (item.goalId === id) {
            return acc; // Skip this item
        }
        if (item.children) {
            item.children = removeItemIdFromTree(item.children, id);
        }
        acc.push(item);
        return acc;
    }, [] as TreeNode[]);
};

export const removeItemIdFromTabs = (tabs: TabContent[], id: TreeItem["id"]): TabContent[] => {
    return tabs.map((tab) => ({
        ...tab,
        goalIds: tab.goalIds.filter((goalId) => (goalId !== id))
    }));
};

export const createInitialState = (tabData: InitialTab[] = initialTabs, treeData: TreeItem[] = []) => {
    console.log("tabData: ",tabData)
    console.log("treeData: ",treeData)
    const {goals, tabs} = createGoalsAndTabsFromTabContent(tabData);

    // console.log("createInitialState", tabContent, goals, tabs);
    return {
        tabs,
        goals,
        tree: createTreeFromTreeData(treeData),
        treeIds: createTreeIdsFromTreeData(treeData),
    };
};

export const treeDataSlice = createSlice({
    name: "treeData",
    initialState: {
        tree: [] as TreeNode[],
        tabs: {} as Map<Label, TabContent>,
        goals: {} as Record<TreeItem["id"], TreeItem>,
        treeIds: [] as TreeItem["id"][]
    },
    reducers: {
        // setTreeData: (state, action: PayloadAction<TreeItem[]>) => {
        //     state.treeData = action.payload;
        // },
        // setTabData: (state, action: PayloadAction<TabContent[]>) => {
        //     state.tabData = action.payload;
        // },
        addGoal(state, action: PayloadAction<TreeItem>) {
            state.goals[action.payload.id] = action.payload;
            state.tabs.get(action.payload.type)?.goalIds.push(action.payload.id);
        },
        addGoalToTab: (state, action: PayloadAction<TreeItem>) => {
            state.tabs.get(action.payload.type)?.goalIds.push(action.payload.id);
            state.goals[action.payload.id] = action.payload;
        },
        setTreeData: (state, action: PayloadAction<TreeItem[]>) => {
            state.tree = createTreeFromTreeData(action.payload);
        },
        addGoalToTree: (state, action: PayloadAction<TreeItem>) => {
            state.tree.push(newTreeNode({goalId: action.payload.id}));
            state.treeIds.push(action.payload.id);
        },
        deleteGoal: (state, action: PayloadAction<TreeItem>) => {
            const tabContent = state.tabs.get(action.payload.type);
            if (tabContent) {
                tabContent.goalIds = tabContent.goalIds.filter((id) => id !== action.payload.id);
            }
            state.tree = removeItemIdFromTree(state.tree, action.payload.id);
            state.treeIds = state.treeIds.filter((treeId) => treeId !== action.payload.id);
            delete state.goals[action.payload.id];
        },
        updateTextForGoalId: (state, action: PayloadAction<{
            id: TreeItem["id"],
            text: string
        }>) => {
            state.goals[action.payload.id] = {
                ...state.goals[action.payload.id],
                content: action.payload.text
            };
        },
        reset: (state, action: PayloadAction<{
            tabData: InitialTab[],
            treeData: TreeItem[]
        } | undefined>) => {
            const initialState = (action.payload) ? createInitialState(action.payload.tabData, action.payload.treeData)
                : createInitialState(initialTabs, []);
            Object.assign(state, initialState);
            
            // Clear the "first visit" flag when reset is called
            // This allows users to choose whether to load default data again
            if (typeof window !== 'undefined') {
                localStorage.removeItem('mm-editor-has-visited');
            }
        },
        // Load default tree data for first-time users or when user clicks Default Mode
        loadDefault: (state) => {
            // Import defaultTreeData from SectionPanel to avoid circular dependency
            const defaultTreeData: TreeItem[] = [
                {
                    id: 1,
                    content: "Functional Goal",
                    type: "Do",
                    children: [
                        {
                            id: 6,
                            content: "Functional Goal 2",
                            type: "Do",
                            children: [
                                {
                                    id: 7,
                                    content: "Functional Goal 3",
                                    type: "Do",
                                    children: []
                                }
                            ]
                        },
                        {
                            id: 8,
                            content: "Functional Goal 4",
                            type: "Do",
                            children: []
                        }
                    ]
                },
                {
                    id: 2,
                    content: "Quality Goals",
                    type: "Be",
                    children: []
                },
                {
                    id: 3,
                    content: "Emotional Goals",
                    type: "Feel",
                    children: []
                },
                {
                    id: 4,
                    content: "Stakeholders",
                    type: "Who",
                    children: []
                },
                {
                    id: 5,
                    content: "Negatives",
                    type: "Concern",
                    children: []
                }
            ];
            
            // Convert defaultTreeData to InitialTab format for tabs
            // Ensure each tab has valid goals with proper type mapping
            const defaultTabData = initialTabs.map(tab => {
                const tabGoals = defaultTreeData.filter(goal => goal.type === tab.label);
                // If no goals found for this tab type, create an empty goal with the correct type
                if (tabGoals.length === 0) {
                    return {
                        ...tab,
                        rows: [newTreeItem({id: Date.now(), type: tab.label})]
                    };
                }
                return {
                    ...tab,
                    rows: tabGoals
                };
            });
            
            // Create initial state with the default data
            const initialState = createInitialState(defaultTabData, defaultTreeData);
            
            // Ensure all nested goals are properly added to the goals object
            const allGoals: TreeItem[] = [];
            const collectGoals = (goals: TreeItem[]) => {
                goals.forEach(goal => {
                    allGoals.push(goal);
                    if (goal.children && goal.children.length > 0) {
                        collectGoals(goal.children);
                    }
                });
            };
            
            // Collect all goals including nested ones
            collectGoals(defaultTreeData);
            
            // Update the goals object to include all nested goals
            allGoals.forEach(goal => {
                initialState.goals[goal.id] = goal;
            });
            
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
        selectTreeData: (state) => createTreeDataFromTreeNode(state.goals, state.tree),
        selectGoalsForLabel: (state, label: Label) => state.tabs.get(label)?.goalIds.map((goalId) => state.goals[goalId]) ?? []
    }
});

export const {addGoal, addGoalToTab, setTreeData, addGoalToTree, deleteGoal, updateTextForGoalId, reset, loadDefault} = treeDataSlice.actions;
export const {selectGoalsForLabel} = treeDataSlice.selectors;

