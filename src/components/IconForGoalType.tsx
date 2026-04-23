import {FC} from "react";

import {Label} from "./types.ts";

import BeIcon from "/img/Cloud.png";
import DoIcon from "/img/Function.png";
import FeelIcon from "/img/Heart.png";
import ConcernIcon from "/img/Risk.png";
import WhoIcon from "/img/Stakeholder.png";

const iconFromType = (type: Label) => {
    const typeToIcon = {
        Be: BeIcon,
        Do: DoIcon,
        Concern: ConcernIcon,
        Feel: FeelIcon,
        Who: WhoIcon,
    };

    if (type in typeToIcon) {
        return typeToIcon[type];
    }

    throw Error(`iconFromType: Unknown type "${type}"`);
};

const IconForGoalType: FC<{type: Label}> = ({type}) => (
    <img src={iconFromType(type)}
         alt={`${type} icon`}
         className="ms-2 me-1"
         style={{
             height: type === "Who" ? "30px" : "20px",
         }}/>
);

export default IconForGoalType;