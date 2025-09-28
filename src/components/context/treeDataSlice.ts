import {createSlice, current, PayloadAction} from "@reduxjs/toolkit";
import {
    createTabDataFromTabs,
    createTreeDataFromTreeNode,
    createTreeIdsFromTreeData,
    Label,
    TabContent,
    TreeItem,
    TreeNode
} from "./FileProvider.tsx";
import {InitialTab, initialTabs} from "../../data/initialTabs.ts";

export const newTreeNode = ({goalId, instanceID,children = []}: {
    goalId: TreeItem["id"],
    instanceID:TreeItem["instanceID"]
    children?: TreeNode[]
}) => ({
    goalId,
    instanceID,
    children
});

export const createTreeFromTreeData = (
  treeData: TreeItem[],
): TreeNode[] => {

  return treeData.map((ti) => ({
    goalId: ti.id,
    // if ti.instanceID exists, use it, else compute one
    instanceID: ti.instanceID,
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
    const allGoals = initialTabs.map((tab) => tab.rows).flat();
    const goals = Object.fromEntries(allGoals.map((goal) => [goal.id, goal]));

    return {goals, tabs};
};

// remove each item from tree
export const removeItemIdFromTree = (
  items: TreeNode[],
  id: TreeNode["goalId"],
  instanceID:TreeNode["instanceID"],
  removeChildren: boolean=true
): TreeNode[] => {
  return items.reduce((acc, item) => {

    if (item.goalId === id && item.instanceID==instanceID) {
       
      if (!removeChildren && item.children) {
        // Promote children to parent level
        acc.push(...item.children);
      }
      return acc; // skip this item
    }

    if (item.children) {
      item.children = removeItemIdFromTree(item.children, id, instanceID,removeChildren);
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

const removeAllReferenceFromHierarchy = (
  tree: TreeNode[],
  goalId: TreeItem["id"],
  instanceID?: TreeItem["instanceID"],
): TreeNode[] => {
  return tree
    .filter(node => {
      if (instanceID !== undefined) {
        // keep nodes that are not this specific instance
        return !(node.goalId === goalId && node.instanceID === instanceID);
      } else {
        // keep nodes that do not match the goalId
        return node.goalId !== goalId;
      }
    })
    .map(node => ({
      ...node,
      children: node.children
        ? removeAllReferenceFromHierarchy(node.children, goalId, instanceID)
        : []
    }));
};


const generateInstanceID = (treeIds:Record<TreeItem["id"], TreeItem["instanceID"][]>,goalId:TreeItem["id"]):TreeItem["instanceID"]=>{
  //if the goal is the first time moved to the hierachy
  if(treeIds[goalId]==undefined){
    treeIds[goalId]=[]
  }

  // give it new instance id 
  const maxSuffix:number = treeIds[goalId].length > 0
    ? Math.max(
        ...treeIds[goalId].map(it => {
          console.log("generateInstanceID: ",it)
          const parts = it.split("-");
          return Number(parts[-1]); // extract the last number
        })
      )
    : 0;
    
  return `${goalId}-${maxSuffix+1}`
}

//
export const createInitialState = (tabData: InitialTab[] = initialTabs, treeData: TreeItem[] = []) => {

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
        treeIds: {} as Record<TreeItem["id"], TreeItem["instanceID"][]> 
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
            // the instance id is given only when add to the tree
            const instanceID = generateInstanceID(state.treeIds,action.payload.id)
            state.tree.push(newTreeNode({
                goalId: action.payload.id,
                instanceID: instanceID
            }));
            state.treeIds[action.payload.id].push(instanceID)
        },
        // remove goal(s) and its children from canvas
        removeGoalIdFromTree: (state, action: PayloadAction<{
            id: TreeItem["id"],
            instanceID:TreeItem["instanceID"]
            removeChildren: boolean
        }>) => {
            state.tree = removeItemIdFromTree(state.tree, action.payload.id,action.payload.instanceID, action.payload.removeChildren);
            // state.treeIds = createTreeIdsFromTreeNode(state.tree);
        },
        // delete it will also delete the reference in the tree
        deleteGoalFromGoalList: (state, action: PayloadAction<{
            item:TreeItem}>) => {
            const tabContent = state.tabs.get(action.payload.item.type);
            if (tabContent) {
                tabContent.goalIds = tabContent.goalIds.filter((id) => id !== action.payload.item.id);
            }
            delete state.goals[action.payload.item.id];
            // remove it and its reference
            state.tree = removeAllReferenceFromHierarchy(state.tree,action.payload.item.id,undefined)
            delete state.treeIds[action.payload.item.id];
        },
        // delete it will not affect the orginal and other reference
        deleteGoalReferenceFromHierarchy: (state, action: PayloadAction<{
            item:TreeItem}>) => {
            // only itself
            state.tree = removeAllReferenceFromHierarchy(state.tree,action.payload.item.id,action.payload.item.instanceID)
            state.treeIds[action.payload.item.id] = state.treeIds[action.payload.item.id].filter(node=>node!==action.payload.item.instanceID);
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

export const {addGoal, addGoalToTab, setTreeData, addGoalToTree, deleteGoalReferenceFromHierarchy,deleteGoalFromGoalList, updateTextForGoalId, reset, removeGoalIdFromTree} = treeDataSlice.actions;
export const {selectGoalsForLabel} = treeDataSlice.selectors;

