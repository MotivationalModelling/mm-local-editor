import Container from "react-bootstrap/Container";

import WelcomeHeader from "./WelcomeHeader";
// import PaperFooter from "./PaperFooter";
import WelcomeFooter from "./WelcomeFooter";
import PaperReferenceList from "./PaperReferenceList";
import {papers} from "../data/papers.ts";

const Papers = () => {
    return (
        <div id="bg" style={{minHeight: "100vh"}} className="d-flex flex-column">
            <WelcomeHeader/>
                <Container style={{overflow: "auto", height: "90vh"}}>
                    <PaperReferenceList references={papers}/>
                </Container>
            <WelcomeFooter destination="" name="Home"/>
        </div>
    );
};

export default Papers;
