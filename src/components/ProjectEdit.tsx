import React, {useState} from "react";

import ProjectEditHeader from "./header/ProjectEditHeader";
import "./ProjectEdit.css";
import SectionPanel, {ProjectEditTab} from "./SectionPanel";
import {GraphProvider} from "./context/GraphContext";

const ProjectEdit: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ProjectEditTab>("goal");

    return (
        <GraphProvider>
            <ProjectEditHeader showGraphSection={showGraphSection}/>
            <ProgressBar showGoalSection={showGoalSection}
                         setShowGoalSection={setShowGoalSection}
                         setShowGraphSection={setShowGraphSection}/>
            <SectionPanel showGoalSection={showGoalSection}
                          showGraphSection={showGraphSection}
                          paddingX={15}/>
        </GraphProvider>
    );
};

export default ProjectEdit;
