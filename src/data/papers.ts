export interface Paper {
    id: string;
    title: string;
    authors: string;
    year: number;
    description: string;
    link: string; // Leave empty for now, you can fill in later
}

export const papers: Paper[] = [
    {
        id: 'QSRR-26-01',
        title: 'Maintaining AMMBER - Lessons Learned from instructing students in software maintenance',
        authors: 'The whole team',
        year: 2025,
        description: 'Lessons learned from instructing students in software maintenance.',
        link: 'https://www.preprints.org/manuscript/202602.0183',
    },
    {
        id: 'QSRR-25-02',
        title: 'Hybrid Intelligence in Requirements Education: Preserving Student Agency in Refining User Stories with Generative AI',
        authors: 'Sterling, L. and Oliveira, O.',
        year: 2025,
        description: 'Preserving student agency in refining user stories with generative AI.',
        link: 'https://www.preprints.org/manuscript/202512.1658',
    },
    {
        id: 'QSRR-25-01',
        title: 'Finding Your Voice: Using Generative AI to Help International Students Improve Their Writing',
        authors: 'Sterling, L., Ye, C., Ying, H., & Chen, Z.',
        year: 2025,
        description: 'Using generative AI to help international students improve their writing.',
        link: 'https://www.mdpi.com/2078-2489/16/4/289',
    },
    {
        id: 'QSRR-25-02',
        title: 'Hybrid Intelligence in Requirements Education: Preserving Student Agency in Refining User Stories with Generative AI',
        authors: 'Oliveira, O.',
        year: 2025,
        description: 'Preserving student agency in refining user stories with generative AI.',
        link: 'https://www.preprints.org/manuscript/202512.1658',
    },
    {
        id: 'QSRR-24-02',
        title: "How Motivational Goal Model Could Improve BONC's Development of Data Asset Management System",
        authors: 'Cao Y.',
        year: 2024,
        description: "How motivational goal models could improve BONC's development of a data asset management system.",
        link: 'https://static1.squarespace.com/static/61136f0c2dddc2734b652409/t/66a983f7943dec60d7946ade/1722385421247/Internship+Report+annotated+Yuchen+Cao.pdf',
    },
    {
        id: 'QSRR-24-01',
        title: 'Venus, The Validation Engine for User Stories',
        authors: 'Xiang X., Song Y., Sterling L., Sammut J., Cao Y.',
        year: 2024,
        description: 'Venus, the validation engine for user stories.',
        link: 'https://static1.squarespace.com/static/61136f0c2dddc2734b652409/t/66a0f0095f21960af983fcc8/1721823243442/conference_latex_template_10_17_19.pdf',
    },
    {
        id: 'QSRR-23-04',
        title: 'Automating user story validation during the build phase of the Software Development Lifecycle (SDLC)',
        authors: 'Sammut J.',
        year: 2023,
        description: 'Automating user story validation during the build phase of the SDLC.',
        link: 'https://static1.squarespace.com/static/61136f0c2dddc2734b652409/t/66a98421e31a11229e462327/1722385445277/James+Sammut+-+502030+-+Final+Report.pdf',
    },
    {
        id: 'QSRR-23-03',
        title: 'Exploring the Feasibility of Generating User Stories from Motivational Model using Artificial Intelligence Language Model',
        authors: 'Lyu J.',
        year: 2023,
        description: 'Exploring the feasibility of generating user stories from motivational models using AI language models.',
        link: 'https://static1.squarespace.com/static/61136f0c2dddc2734b652409/t/66a9844570c4056b028b073b/1722385479761/Jin+Lyu+Final+Report.pdf',
    },
    {
        id: 'QSRR-23-02',
        title: 'Motivational Modeling Project: Notes and Analyses',
        authors: 'Hirve A.',
        year: 2023,
        description: 'Notes and analyses from the motivational modeling project.',
        link: 'https://static1.squarespace.com/static/61136f0c2dddc2734b652409/t/66a98462da09ba19ff3b74bb/1722385540009/AishwaryaMotivational+Modeling+Project.pdf',
    },
    {
        id: 'QSRR-23-01',
        title: 'Understandability of Requirements Artefacts - A Small Survey',
        authors: 'Sterling L., Hirve A., Ahmed H., Vo Q.',
        year: 2023,
        description: 'A small survey on the understandability of requirements artefacts.',
        link: 'https://static1.squarespace.com/static/61136f0c2dddc2734b652409/t/66a0eac7ddfa866a8258752c/1721821961895/Understandability+of+Requirements+Artefacts',
    },
    {
        id: 'QSRR-22-01',
        title: 'Transitioning from motivational goal models to user stories within user-centred software design',
        authors: 'Oliveira, E., Maram, V., Sterling, L.',
        year: 2022,
        description: 'Transitioning from motivational goal models to user stories within user-centred software design.',
        link: 'https://ceur-ws.org/Vol-3107/paper7.pdf',
    },
    {
        id: 'QSRR-20-01',
        title: 'Motivational Goal Modelling Evaluation Report',
        authors: 'Timms M.',
        year: 2020,
        description: 'Evaluation report on motivational goal modelling.',
        link: 'https://static1.squarespace.com/static/61136f0c2dddc2734b652409/t/66a9c2faa73eef16ec862a9b/1722401530346/200213+Motivational+Modeling+Evaluation+Final+Report.pdf',
    },
    {
        id: 'QSRR-19-01',
        title: 'Applying Motivational Modelling in Modern Software Development',
        authors: 'McKenna K.',
        year: 2019,
        description: 'Applying motivational modelling in modern software development.',
        link: 'https://static1.squarespace.com/static/61136f0c2dddc2734b652409/t/66a0e9ceb316dc12602da188/1721822006999/Applying+Motivational+Modelling+in+Modern+Software+Development',
    },
    {
        id: 'QSRR-18-03',
        title: 'Development history of the motivational modelling editor',
        authors: '',
        year: 2018,
        description: 'Development history of the motivational modelling editor.',
        link: '', // Add link here
    },
    {
        id: 'QSRR-18-02',
        title: 'Making a Year-Long Software Engineering Project Agile by Sterling, Lopez-Lorca',
        authors: 'Lorca, A. L., Sterling, L.',
        year: 2018,
        description: 'Making a year-long software engineering project agile.',
        link: '', // Add link here
    },
    {
        id: 'QSRR-18-01',
        title: 'Teaching Motivational Models in Agile Requirements Engineering',
        authors: 'Lorca, A. L., Burrows, R., & Sterling, L.',
        year: 2018,
        description: 'Teaching motivational models in agile requirements engineering.',
        link: 'https://ieeexplore.ieee.org/document/8501282',
    },
    {
        id: 'QSRR-17-01',
        title: 'Motivational Goal Models – The Big Picture',
        authors: 'Sterling L.',
        year: 2017,
        description: 'The big picture of motivational goal models.',
        link: 'https://static1.squarespace.com/static/61136f0c2dddc2734b652409/t/66a9c295d2a1e377d82b0c3c/1722401441685/2+Motivational+Goal+Models+%E2%80%93+The+Big+Picture.pdf',
    },
];