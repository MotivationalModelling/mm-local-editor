import ProjectEditHeader from "./ProjectEditHeader";
import "./ProjectEdit.css";
import SectionPanel from "./SectionPanel";
import { useState } from "react";

const ProjectEdit = () => {
  const [showGoalSection, setShowGoalSection] = useState(false);
  const [showGraphSection, setShowGraphSection] = useState(false);

  return (
    <div>
      <ProjectEditHeader />
      <SectionPanel
        showGoalSection={showGoalSection}
        showGraphSection={showGraphSection}
        paddingX={15}
      />
      <button onClick={() => setShowGoalSection(!showGoalSection)}>
        Show Section 1
      </button>
      <button onClick={() => setShowGraphSection(!showGraphSection)}>
        Show Section 3
      </button>
    </div>
  );
};

export default ProjectEdit;
