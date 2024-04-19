import React from "react";
import Nestable, { NestableProps } from "react-nestable";
import "react-nestable/dist/styles/index.css";
import "./Tree.css";
import { FaPlus, FaMinus } from "react-icons/fa";
import DeleteIcon from "../assets/img/trash-alt-solid.svg";
import { TreeItem } from "./SectionPanel";

// Inline style for element in Nestable, css style import not working
const styles: React.CSSProperties = {
  position: "relative",
  background: "white",
  display: "flex",
  border: "1px solid gray",
  borderRadius: "5px",
  alignItems: "center",
  padding: "0.1rem",
};

type TreeProps = {
  treeData: TreeItem[];
  setTreeData: React.Dispatch<React.SetStateAction<TreeItem[]>>;
};

const Tree = ({ treeData, setTreeData }: TreeProps) => {
  // Remove item recursively from tree data
  const removeItemFromTree = (
    items: TreeItem[],
    idToRemove: number
  ): TreeItem[] => {
    return items.reduce((acc, currentItem) => {
      if (currentItem.id === idToRemove) {
        return acc; // Skip this item
      }
      if (currentItem.children) {
        currentItem.children = removeItemFromTree(
          currentItem.children,
          idToRemove
        );
      }
      acc.push(currentItem);
      return acc;
    }, [] as TreeItem[]);
  };

  // Delete item by its id
  const handleDeleteItem = (id: number) => {
    const updatedTreeData = removeItemFromTree(treeData, id);
    setTreeData(updatedTreeData);
  };

  // Function for rendering every item
  const renderItem: NestableProps["renderItem"] = ({ item, collapseIcon }) => {
    return (
      <div style={styles} className="tree-list">
        {collapseIcon}
        <div
          style={{
            padding: ".5rem",
            flex: 1,
          }}
        >
          {item.text}
        </div>

        <img
          className="delete-icon"
          onClick={() => handleDeleteItem(item.id)}
          src={DeleteIcon}
          alt="Delete"
          width={15}
        />
      </div>
    );
  };

  // Button for collapse and expand
  const Collapser = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const iconSize = 13;
    return (
      <div
        style={{
          display: "flex",
          paddingLeft: "0.5rem",
          cursor: "pointer",
        }}
      >
        {isCollapsed ? <FaPlus size={iconSize} /> : <FaMinus size={iconSize} />}
      </div>
    );
  };

  return (
    <div style={{ width: "100%", height: "100%", alignSelf: "flex-start" }}>
      <Nestable
        onChange={({items}) => console.log(items)}
        items={treeData}
        renderItem={renderItem}
        renderCollapseIcon={({ isCollapsed }) => (
          <Collapser isCollapsed={isCollapsed} />
        )}
      />
    </div>
  );
};

export default Tree;
