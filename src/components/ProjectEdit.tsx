import React, {useState} from "react";

import ProjectEditHeader from "./ProjectEditHeader";
import "./ProjectEdit.css";
import SectionPanel from "./SectionPanel";
import ProgressBar from "./ProgressBar";

const ProjectEdit: React.FC = () => {
  const [showGoalSection, setShowGoalSection] = useState(true);
  const [showGraphSection, setShowGraphSection] = useState(false);

  return (
    <div>
      <ProjectEditHeader />
        <ProgressBar setShowGoalSection={setShowGoalSection}
                     setShowGraphSection={setShowGraphSection}/>
        <SectionPanel showGoalSection={showGoalSection}
                      showGraphSection={showGraphSection}
                      setShowGoalSection={setShowGoalSection}
                      paddingX={15}/>
    </div>
  );
};

export default ProjectEdit;
