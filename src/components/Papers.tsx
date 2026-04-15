import Container from "react-bootstrap/Container";

import WelcomeHeader from "./WelcomeHeader";
// import PaperFooter from "./PaperFooter";
import WelcomeFooter from "./WelcomeFooter";
import PaperReferenceList from "./PaperReferenceList";
import {papers} from "../data/papers.ts";
import { Link } from "react-router-dom";

const Papers = () => {
    return (
        <div id="bg" style={{ minHeight: "100vh" }} className="d-flex flex-column">
            <WelcomeHeader/>
                <Container style={{overflow: "auto", height: "90vh"}}>
                    <PaperReferenceList references={papers}/>
                    <Link to="https://www.leonsterling.com/about-research-report-series" target="_blank" className="text-decoration-none">
                        <p className="text-center mt-3">Read more</p>
                    </Link>
                </Container>     
            <WelcomeFooter destination="" name="Home"/>
        </div>
    );
};

export default Papers;
