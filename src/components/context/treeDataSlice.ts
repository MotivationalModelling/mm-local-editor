import {createSlice, current, PayloadAction} from "@reduxjs/toolkit";
import {
    createTabDataFromTabs,
    createTreeDataFromTreeNode,
    createTreeIdsFromTreeData, createTreeIdsFromTreeNode,
    Label,
    TabContent,
    TreeItem,
    TreeNode
} from "./FileProvider.tsx";
import {InitialTab, initialTabs} from "../../data/initialTabs.ts";

export const newTreeNode = ({goalId, copies,children = []}: {
    goalId: TreeItem["id"],
    copies:TreeItem["copies"]
    children?: TreeNode[]
}) => ({
    goalId,
    copies,
    children
});

export const createTreeFromTreeData = (
  treeData: TreeItem[],
  existingOcurrance: Record<TreeItem["id"], number> = {}
): TreeNode[] => {
  
  const existingDictionary = (goalId: TreeItem["id"]): number => {
    if (existingOcurrance[goalId]===undefined) {
      existingOcurrance[goalId] = 1;
    } else {
      existingOcurrance[goalId] = existingOcurrance[goalId] + 1;
    }
    return existingOcurrance[goalId];
  };

  return treeData.map((ti) => ({
    goalId: ti.id,
    // if ti.copies exists, use it, else compute one
    copies: existingDictionary(ti.id),
    children: createTreeFromTreeData(ti.children ?? [], existingOcurrance)
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
    const allGoals = initialTabs.map((tab) => tab.rows).flat();
    const goals = Object.fromEntries(allGoals.map((goal) => [goal.id, goal]));

    return {goals, tabs};
};

// remove each item from tree
export const removeItemIdFromTree = (
  items: TreeNode[],
  id: TreeNode["goalId"],
  copies:TreeNode["copies"],
  removeChildren: boolean=true
): TreeNode[] => {
  return items.reduce((acc, item) => {

    if (item.goalId === id && item.copies==copies) {
       
      if (!removeChildren && item.children) {
        // Promote children to parent level
        acc.push(...item.children);
      }
      return acc; // skip this item
    }

    if (item.children) {
      item.children = removeItemIdFromTree(item.children, id, copies,removeChildren);
    }
    
    acc.push(item);
    return acc;
  }, [] as TreeNode[]);
};
export const removeGoalFromGoalList = (
  items: TreeNode[],
  id: TreeNode["goalId"],
): TreeNode[] => {
  return items.reduce((acc, item) => {

    if (item.goalId === id) {
       
      if (item.children) {
        // Promote children to parent level
        acc.push(...item.children);
      }
      return acc; // skip this item
    }

    if (item.children) {
      item.children = removeGoalFromGoalList(item.children, id);
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

//
export const createInitialState = (tabData: InitialTab[] = initialTabs, treeData: TreeItem[] = []) => {
    console.log("initial tabData from localstorage: ",tabData)
    console.log("initial treeData from localstorage: ",treeData)
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
        treeIds: {} as Record<TreeItem["id"], TreeItem["copies"][]> 
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
            // copies incremented by 1
            state.tree.push(newTreeNode({
                goalId: action.payload.id,
                copies: action.payload.copies + 1 
            }));
            if (!state.treeIds[action.payload.id]) {
                state.treeIds[action.payload.id] = [];
            }
            console.log("addGoalToTree: ",action.payload.id)
            console.log("addGoalToTree: ",action.payload.copies)
            // Push the copiedId (instance ID)
            state.treeIds[action.payload.id].push(action.payload.copies + 1 )
            
            // state.treeIds.push(action.payload.id);
        },
        // remove goal(s) and its children from canvas
        removeGoalIdFromTree: (state, action: PayloadAction<{
            id: TreeItem["id"],
            copies:TreeItem["copies"]
            removeChildren: boolean
        }>) => {
            state.tree = removeItemIdFromTree(state.tree, action.payload.id,action.payload.copies, action.payload.removeChildren);
            state.treeIds = createTreeIdsFromTreeNode(state.tree);
        },
        // delete from goal list/hierachy
        deleteGoal: (state, action: PayloadAction<{
            item:TreeItem,
            deleteFromGoalList:boolean}>) => {
            console.log("delete single goal: ",action.payload.deleteFromGoalList)

            const tabContent = state.tabs.get(action.payload.item.type);
            if (tabContent) {
                tabContent.goalIds = tabContent.goalIds.filter((id) => id !== action.payload.item.id);
            }
            // deleteFromGoalList
            if(action.payload.deleteFromGoalList){
                delete state.goals[action.payload.item.id];
                delete state.treeIds[action.payload.item.id];
            }else{
                // not deleteFromGoalList -> hierachy
                state.tree = removeGoalFromGoalList(state.tree, action.payload.item.id);
                if (state.treeIds[action.payload.item.id]) {
                    state.treeIds[action.payload.item.id] = state.treeIds[action.payload.item.id].filter(
                    copiedId => copiedId !== action.payload.item.copies
                    );
            }}
            
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

export const {addGoal, addGoalToTab, setTreeData, addGoalToTree, deleteGoal, updateTextForGoalId, reset, removeGoalIdFromTree} = treeDataSlice.actions;
export const {selectGoalsForLabel} = treeDataSlice.selectors;

