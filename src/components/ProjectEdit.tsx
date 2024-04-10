import ProjectEditHeader from "./ProjectEditHeader";
import "./ProjectEdit.css";
import SectionPanel from "./SectionPanel";
import { useState } from "react";
import ProgressBar from "./ProgressBar";

const ProjectEdit = () => {
  const [showGoalSection, setShowGoalSection] = useState<boolean>(true);
  const [showGraphSection, setShowGraphSection] = useState<boolean>(false);

  return (
    <div>
      <ProjectEditHeader />
      <ProgressBar
        setShowGoalSection={setShowGoalSection}
        setShowGraphSection={setShowGraphSection}
      />
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
