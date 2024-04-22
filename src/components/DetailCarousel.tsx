import React from "react";

import Carousel from "react-bootstrap/Carousel";

export const DetailCarousel: React.FC = () => (
    <Carousel interval={null}>
        <Carousel.Item>
            <div className="content">
                <img src="./leon.png"
                     alt="leon_icon"
                     style={{height: "100px", width: "auto"}}/>
                <h1 className="my-4">AMMBER</h1>
                <h2 className="mt-4" style={{fontSize: "20px"}}>
                    A Motivational Model Builder For Essential Requirements
                </h2>
            </div>
        </Carousel.Item>
        <Carousel.Item>
            {/*<div className="content">*/}
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
                <br/>
            </div>
        </Carousel.Item>
    </Carousel>
);