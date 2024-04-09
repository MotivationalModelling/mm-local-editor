import ProjectEditHeader from "./ProjectEditHeader";
import "./ProjectEdit.css";
import SectionPanel from "./SectionPanel";
import { useState } from "react";

const ProjectEdit = () => {
  const [showGoalSection, setShowGoalSection] = useState(false);

  return (
    <div>
      <ProjectEditHeader />
      <SectionPanel showGoalSection={showGoalSection} />
      <button onClick={() => setShowGoalSection(!showGoalSection)}>
        Show Section 1
      </button>
    </div>
  );
};

export default ProjectEdit;
