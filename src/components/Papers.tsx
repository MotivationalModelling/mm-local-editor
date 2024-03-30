import React from "react";
import WelcomeHeader from "./WelcomeHeader";
// import PaperFooter from "./PaperFooter";
import { Link } from "react-router-dom";
import WelcomeFooter from "./WelcomeFooter";

const Papers = () => {
  return (
    <div
      className="cover-container d-flex h-100 p-3 mx-auto flex-column text-center"
      id="bg"
    >
      <WelcomeHeader />
      <main role="main" className="inner cover">
        <div>
          <p>
            <Link to="/papers/Adding-Emotions-to-Models-in-a-Viewpoint-Modelling-Framework-From-Agent-Oriented-Software-Engineering_-A-Case-Study-With-Emergency-Alarms.pdf">
              Adding-Emotions-to-Models.pdf
            </Link>
          </p>
          <p>
            <Link to="/papers/Emotion-Led_Modelling_JSS_paper.pdf">
              {" "}
              Emotion-Led_Modelling.pdf
            </Link>
          </p>
          <p>
            <Link to="/papers/Interdisciplinary-Design-Teams-Translating-Ethnographic-Field-Data-Into-Design-Models_-Communicating-Ambiguous-Concepts-Using-Quality-Goals.pdf">
              Interdisciplinary-Design.pdf
            </Link>
          </p>
        </div>
      </main>
      <WelcomeFooter destination="" name="Home" />
    </div>
  );
};

export default Papers;
