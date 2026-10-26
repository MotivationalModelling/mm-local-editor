import React, {useState} from "react";

import ProjectEditHeader from "./header/ProjectEditHeader";
import "./ProjectEdit.css";
import SectionPanel from "./SectionPanel";
import ProgressBar from "./ProgressBar";
import {GraphProvider} from "./context/GraphContext";

const ProjectEdit: React.FC = () => {
    const [showGoalSection, setShowGoalSection] = useState(true);
    const [showGraphSection, setShowGraphSection] = useState(false);
    const [showFeedbackSection, setShowFeedbackSection] = useState(false);

    return (
        <GraphProvider>
            <ProjectEditHeader showGoalSection={showGoalSection}
                               setShowGoalSection={setShowGoalSection}
                               showGraphSection={showGraphSection}
                               showFeedbackSection={showFeedbackSection}
                               onToggleFeedback={() => setShowFeedbackSection((current) => !current)}/>
            <ProgressBar showGoalSection={showGoalSection}
                         setShowGoalSection={setShowGoalSection}
                         setShowGraphSection={setShowGraphSection}/>
            <SectionPanel showGoalSection={showGoalSection}
                          showGraphSection={showGraphSection}
                          showFeedbackSection={showFeedbackSection}
                          onCloseFeedback={() => setShowFeedbackSection(false)}
                          paddingX={15}/>
        </GraphProvider>
    );
};

export default ProjectEdit;
