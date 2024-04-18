import Container from "react-bootstrap/Container";

import WelcomeHeader from "./WelcomeHeader";
// import PaperFooter from "./PaperFooter";
import WelcomeFooter from "./WelcomeFooter";
import PaperReferenceList, {Reference} from "./PaperReferenceList";

const papers: Reference[] = [{
    title: `Using Motivational Models to Promote Emotional Goals Among Software Engineering Students`,
    summary: `There has been increasing awareness in recent years
        of the importance of considering broader, social and personal
        goals in software engineering. One important aspect is the need
        to engender certain feelings in users when they interact with
        software. Such emotional goals are relatively new to software
        development. While there are established methods for teaching
        requirements elicitation for standard goals and evaluating
        whether they have been met, there is much less work on
        evaluating whether emotional goals have been met through software.
        For the past five years, emotional goals have been explicitly
        included while teaching software requirements with students
        at The University of Melbourne and Swinburne University of
        Technology, both in dedicated subjects and in project subjects.
        Students have been strongly encouraged to incorporate emotional
        goals in the design of projects’ requirements through the use of
        motivational models. In this paper we discuss and reflect on
        our experience teaching motivational modelling that is aimed at
        supporting students in the creation and evaluation of emotional
        goals in the software requirements phase.`,
    link: "/papers/CHASE_2023_emotions.pdf"
}, {
    title: `Motivational models for validating agile requirements
        in Software Engineering subjects`,
    summary: `This paper describes how motivational models can be used to
        cross check agile requirements artifacts to improve consistency
        and completeness of software requirements. Motivational models provide a high
        level understanding of the purposes of a software system. They complement
        personas and user stories which focus more on user needs rather
        than on system features. We present an exploratory case study sought
        to understand how software engineering students could use motivational
        models to create better requirements artifacts so they are understandable
        to non-technical users, easily understood by developers, and are
        consistent with each other. Nine consistency principles were created as
        an outcome of our study and are now successfully adopted by software
        engineering students at the University of Melbourne to ensure consistency
        between motivational models, personas, and user stories in requirements
        engineering.`,
    link: "/papers/CSCE_2021.pdf"
}, {
    title: "Requirements Elicitation and Repeatable Processes -\n" +
        "Interdisciplinary Collaboration between Software\n" +
        "Engineering and Design",
    summary: `Motivational modelling and the use of emotional
        goals has flourished from interdisciplinary interactions between
        software engineering, HCI and design. This paper discusses how
        interdisciplinary interactions produced outcomes that would not
        have been achieved if we had stayed within discipline boundaries.
        Innovation from a software perspective was the identification
        of emotional goals, the use of more engaging terminology and
        images, and improved requirements elicitation. Innovation from
        a design perspective was the introduction of an abstraction
        layer that produced helpful methods, spurred new research, and
        provided insight on repeatable processes.`,
    link: "/papers/Design_meets_SE.pdf"
}, {
    title: `Evaluating Ask Izzy: A Mobile Web App for People Experiencing Homelessness`,
    summary: `Conducted a thematic analysis to explore perceptions towards
        Ask Izzy, a mobile web app for homelessness. Currently deployed
        across Australia and attracting over 10,000 users each month.`,
    link: "/papers/ECSCW Final.pdf"
}, {
    title: `Understandability of Requirements Artefacts - A Small Survey`,
    summary: `Motivational goal modelling has evolved from a
        method to build agent-oriented software models to be a general
        method for eliciting requirements for software, products or
        services. The method has been used for over five years in software
        engineering units at the University of Melbourne. Increasingly
        the units have advocated building consistency between software
        requirements artefacts such as motivational models, lists of user
        stories and prioritised requirements presented in a MoSCoW
        table. This paper describes a small survey comparing the
        understandability of three requirements artefacts: motivational models,
        user stories and MoSCoW tables.`,
    link: "/papers/MMSurvey.pdf"
}, {
    title: `Transitioning from motivational goal models to user
        stories within user-centred software design`,
    summary: `Motivational goal modelling has evolved from agent-oriented
        models to allow a shared understanding of a project
        by diverse stakeholders. Building a motivational model is in the
        spirit of user-centred design. Requirements artefacts such as user
        stories and personas should be developed consistently with the
        model. This paper describes a method to generate user stories
        from motivational models. The generated stories are checked by
        users and developers to ensure readabilty and clarity. The method
        has been partially automated within an extension to an editing
        tool.`,
        link: "/papers/MMtoUserStories.pdf"
}, {
    title: `Transitioning from motivational goal models to user stories
        within user-centred software design`,
    link: "/papers/Paper_Motivational_Goals_EHR _2.pdf",
    summary: `Motivational goal modelling has evolved from agent-oriented models
        to allow a shared understanding of a project
        by diverse stakeholders. Building a motivational model is in the
        spirit of user-centred design. Requirements artefacts such as user
        stories and personas should be developed consistently with the
        model. This paper describes a method to generate user stories
        from motivational models. The generated stories are checked by
        users and developers to ensure readabilty and clarity. The method
        has been partially automated within an extension to an editing
        tool.`
}, {
    title: `Motivational Modelling in Software for Homelessness:
        Lessons from an Industrial Study`,
    summary: `Requirements engineering involves the elicitation,
        representation and communication of diverse stakeholder needs.
        However, this can be particularly challenging when developing
        technology embedded within complex social systems. So-called
        socially-oriented requirements can be abstract, ambiguous and
        driven by the organisational, cultural and political contexts of
        the stakeholders involved. Motivational models are one solution
        which supports project-wide understanding of the key goals of
        stakeholders. Yet, there is still a lack of understanding about
        the role they can play in larger industrial projects. We present
        our use of motivational modelling in an Australia-wide project
        that develops new technology to assist people who are homeless
        in accessing service providers. We interviewed 100 stakeholders
        and utilised motivational models to advocate for the needs of
        key stakeholder groups. We discuss the benefits, challenges and
        lessons learned.`,
    link: "/papers/RECameraReady.pdf"
}, {
    title: `Requirements elicitation and specification using
        the agent paradigm: the case study of an aircraft
        turnaround simulator`,
    summary: `In this paper, we describe research results arising from a technology transfer exercise on agent-oriented
        requirements engineering with an industry partner. We introduce two improvements to the state-of-the-art in
        agent-oriented requirements engineering, designed to mitigate two problems experienced by ourselves and
        our industry partner: (1) the lack of systematic methods for agent-oriented requirements elicitation and
        modelling; and (2) the lack of prescribed deliverables in agent-oriented requirements engineering. We discuss
        the application of our new approach to an aircraft turnaround simulator built in conjunction with our industry
        partner, and show how agent-oriented models can be derived and used to construct a complete requirements
        package. We evaluate this by having three independent people design and implement prototypes of the aircraft
        turnaround simulator, and comparing the three prototypes. Our evaluation indicates that our approach is
        effective at delivering correct, complete, and consistent requirements that satisfy the stakeholders, and can be
        used in a repeatable manner to produce designs and implementations. We discuss lessons learnt from applying
        this approach.`,
    link: "/papers/Requirements elicitation and specification using the agent paradi.pdf",
}, {
    title: `Teaching Goal Models in Agile Requirements Engineering`,
    summary: `Software engineering courses continually strive to
        maintain an excellent teaching curriculum that provides students
        with the agile skills as per industry needs. A particular challenge
        of teaching requirements engineering is capturing and communicating
        software requirements without killing team agility
        with excessive documentation. In many projects, requirements
        can be ambiguous and inconsistent. It is important to find
        a middle ground between completely by-passing requirements
        documentation and writing a complete Software Requirements
        Specification. In this paper, we report our experiences, presenting
        a guideline for students and educators who wish to adopt goal
        modelling, a lightweight approach to requirements elicitation
        and modelling, for agile requirements engineering. This is an
        efficient technique that also represents a good boundary object
        to support discussions between the developers and non-technical
        clients. Finally, we outline discussion points regarding where goal
        models could fit into other agile practices.`,
    link: "/papers/Using_Goal_Models_in_Agile_Teaching__RE_.pdf",
}, {
    title: `User Manual for Motivational Model Editor`,
    summary: `User manual`,
    link: "/papers/usermanual.pdf"
}];

const Papers = () => {
    return (
        <div id="bg">
            <WelcomeHeader/>
            {/*<main role="main" className="inner cover">*/}
                <Container style={{overflow: "auto", height: "90vh"}}>
                    <PaperReferenceList references={papers}/>
                </Container>
            {/*</main>*/}
            <WelcomeFooter destination="" name="Home"/>
        </div>
    );
};

export default Papers;
