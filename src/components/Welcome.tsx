import React, { useState } from "react";
import { Carousel } from "react-bootstrap";
import WelcomeHeader from "./WelcomeHeader";
import WelcomeFooter from "./WelcomeFooter";
import WelcomeButtons from "./WelcomeButtons";
import ErrorModal from "./ErrorModal";

const LEON_ICON = "/src/assets/img/leon.png";

const Welcome = () => {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Handle draging files to upload
  const handleDragOver = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    setIsDragging(true);
  };

  return (
    <div
      className="over-container d-flex h-100 p-3  flex-column text-center"
      onDragOver={handleDragOver}
      id="bg"
    >
      <WelcomeHeader />
      <main role="main" className="inner cover">
        {/* Carousel for viewing details*/}
        <Carousel>
          <Carousel.Item>
            <div className="content">
              <img
                src={LEON_ICON}
                alt="leon_icon"
                style={{ height: "100px", width: "auto" }}
              />
              <h1 className="cover-heading mt-4 mb-4">
              AMMBER
              </h1>
              <h2 className="mt-4" style={{fontSize: "20px"}}>A Motivational Model Builder For Essential Requirements</h2>
            </div>
          </Carousel.Item>
          <Carousel.Item>
            <div className="content">
              <h4 className="fw-bold fst-italic">Motivational Models</h4>

              <p className="fw-light text-start">
                Motivational models were originally an agent-oriented
                methodology variation of goal models described in Sterling, L.
                and Taveter, K. The Art of Agent-Oriented Modeling, MIT Press,
                2009. They present a hierarchical structure of the goals of the
                software system at a high-level of abstraction. The models
                capture roles of all stakeholders involved in the system, the
                functional goals of the system, the quality goals of the system,
                and emotional goals, which represent how people want to feel
                when interacting with the system.
              </p>
            </div>
          </Carousel.Item>
          <Carousel.Item>
            <div className="content ">
              <h4 className="fw-bold fst-italic">About Leon Sterling</h4>
              <p className="fw-light text-start">
                Professor Leon Sterling has had a distinguished academic career.
                After completing a PhD at the Australian National University, he
                worked for 15 years at universities in the UK, Israel and the
                United States. He returned to Australia as Professor of Computer
                Science at the University of Melbourne in 1995. He served as
                Head of the Department of Computer Science and Engineering for 6
                years. After stepping down as Head, he took up an
                industry-sponsored chair becoming the Adacel Professor of
                Software Innovation and Engineering. In 2010, he moved to
                Swinburne where he served as Dean of the Faculty of Information
                and Communication Technologies for 4 years and Pro
                Vice-Chancellor (Digital Frontiers) for two years. He has been a
                prominent figure in IT in Australia, being a strong advocate for
                coding in schools through public lectures, blogs, and committee
                memberships. His current research is in incorporating emotions
                in technology development, where motivational models are an
                essential element.
              </p>
              <br />
            </div>
          </Carousel.Item>
        </Carousel>
        <WelcomeButtons isDragging={isDragging} setIsDragging={setIsDragging} />
      </main>
      <WelcomeFooter destination="papers" name="Papers" />
    </div>
  );
};

export default Welcome;
