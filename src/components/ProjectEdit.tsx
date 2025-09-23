import React, { useState } from "react";

import ProjectEditHeader from "./header/ProjectEditHeader";
import "./ProjectEdit.css";
import SectionPanel from "./SectionPanel";
import ProgressBar from "./ProgressBar";
import { GraphProvider} from "./context/GraphContext";

const ProjectEdit: React.FC = () => {
  const [showGoalSection, setShowGoalSection] = useState(true);
  const [showGraphSection, setShowGraphSection] = useState(false);

  return (
    <GraphProvider>
      <div>
        <ProjectEditHeader
          showGoalSection={showGoalSection}
          setShowGoalSection={setShowGoalSection}
          showGraphSection={showGraphSection}
        />
        <ProgressBar
          setShowGoalSection={setShowGoalSection}
          setShowGraphSection={setShowGraphSection}
        />
        <SectionPanel
          showGoalSection={showGoalSection}
          showGraphSection={showGraphSection}
          setShowGoalSection={setShowGoalSection}
          paddingX={15}
        />
      </div>
    </GraphProvider>
  );
};

export default ProjectEdit;
