import React from "react";
import WelcomeHeader from "./WelcomeHeader";
// import PaperFooter from "./PaperFooter";
import { Link } from "react-router-dom";
import WelcomeFooter from "./WelcomeFooter";



const papers:  {
  title: string
  link: string
}[] = [
  {title: "CHASE_2023_emotions", link: "CHASE_2023_emotions.pdf"},
  {title: "CSCE_2021", link: "CSCE_2021.pdf"},
  {title: "Design_meets_SE", link: "Design_meets_SE.pdf"},
  {title: "ECSCW Final", link: "ECSCW Final.pdf"},
  {title: "MMSurvey", link: "MMSurvey.pdf"},
  {title: "MMtoUserStories", link: "MMtoUserStories.pdf"},
  {title: "Paper_Motivational_Goals_EHR _2", link: "Paper_Motivational_Goals_EHR _2.pdf"},
  {title: "RECameraReady", link: "RECameraReady.pdf"},
  {title: "Requirements elicitation and specification using the agent paradi", link: "Requirements elicitation and specification using the agent paradi.pdf"},
  {title: "Using_Goal_Models_in_Agile_Teaching__RE_", link: "Using_Goal_Models_in_Agile_Teaching__RE_.pdf"},
  {title: "usermanual", link: "usermanual.pdf"},
  
]

const Papers = () => {
  return (
    <div
      className="cover-container d-flex h-100 p-3 mx-auto flex-column text-center"
      id="bg"
    >
      <WelcomeHeader />
      <main role="main" className="inner cover">
        <div>
          {papers.map((paper) => (
            <p>
            <Link to={`/papers/${paper.link}`} target="_blank"
            className="text-decoration-none">
              {paper.title}
            </Link>
          </p>
          ))}
          
          
        </div>
      </main>
      <WelcomeFooter destination="" name="Home" />
    </div>
  );
};

export default Papers;
