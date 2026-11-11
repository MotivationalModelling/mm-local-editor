describe("Related links after develop integration", () => {
    const fitModel = () => {
        cy.contains('.card-subtitle', 'Zoom').closest('.card').find('button').eq(1).click();
    };
    it("saves a link, opens it from the canvas, and retains it after refresh", () => {
        const url = "https://example.com/related-document";
        cy.visit("/");
        cy.contains("Create Model").click();
        cy.get('[aria-label="Related link for Do"]').first().click();
        cy.get('#goal-related-link').type(url);
        cy.contains('.modal button', 'Save').click();
        cy.get('.modal').should('not.exist');

        cy.contains("Arrange Hierarchy / Render Model").click();
        cy.window().then((win) => cy.stub(win, "open").as("openLink"));
        cy.get('#graphContainer text').contains(/^Do$/)
            .should('have.css', 'fill', 'rgb(13, 110, 253)')
            .click({force: true});
        cy.get('@openLink').should('have.been.calledWith', url, '_blank', 'noopener,noreferrer');

        cy.reload();
        cy.contains("Arrange Hierarchy / Render Model").click();
        cy.window().then((win) => cy.stub(win, "open").as("restoredLink"));
        cy.get('#graphContainer text').contains(/^Do$/).click({force: true});
        cy.get('@restoredLink').should('have.been.calledWith', url, '_blank', 'noopener,noreferrer');
    });

    for (const type of ['Be', 'Feel', 'Concern']) {
        it(`${type}: preserves list editing, links and exports when a group becomes a single goal`, () => {
            const url = `https://example.com/${type.toLowerCase()}`;
            const rootUrl = 'https://example.com/root';
            const content = 'Careful, "prepared" & ready';
            const edited = `${content} today`;
            const root = {id: 1, content: 'Root goal', type: 'Do', instanceId: '1:1', url: rootUrl, children: []};
            const goals = [content, 'Second goal'].map((text, index) => ({
                id: index + 2, content: text, type, instanceId: `${index + 2}:1`,
                url: index === 0 ? url : 'https://example.com/second', children: [],
            }));
            let saved = '';
            let svgFile: Blob;
            let pngFile: Blob;
            cy.visit('/projectEdit', {onBeforeLoad(window) {
                window.localStorage.setItem('ammber/treeData', JSON.stringify([root, ...goals]));
                window.localStorage.setItem('ammber/tabData', JSON.stringify(
                    ['Do', 'Be', 'Feel', 'Concern', 'Who'].map(label => ({
                        label, icon: '', rows: label === 'Do' ? [root] : label === type ? goals : [],
                    })),
                ));
                Object.defineProperty(window.navigator, 'userAgent', {
                    value: window.navigator.userAgent.replace(/Electron\/\S+\s*/g, '').replace('HeadlessChrome', 'Chrome'),
                });
                Object.defineProperty(window, 'showSaveFilePicker', {value: async (options: SaveFilePickerOptions) => ({
                    createWritable: async () => ({
                        write: async (data: Blob | string) => {
                            if (typeof data === 'string') saved = data;
                            else if (options.suggestedName?.endsWith('.svg')) svgFile = data;
                            else if (options.suggestedName?.endsWith('.png')) pngFile = data;
                        },
                        close: async () => undefined,
                    }),
                })});
            }});
            cy.get('#graphTab').click();
            fitModel();
            cy.window().then(window => cy.stub(window, 'open').as('openGroupedLink'));
            cy.get('#graphContainer li').should('have.length', 2)
                .and('have.css', 'list-style-type', 'disc').first().click({force: true});
            cy.get('@openGroupedLink').should('not.have.been.called');

            cy.get('#clusterTab').click();
            cy.contains('.nav-link', new RegExp(`^${type}$`)).click();
            cy.get(`input[placeholder="Enter ${type}..."][value="Second goal"]`)
                .closest('tr').find('button').not('[title="Related link"]').click();
            cy.get('#graphTab').click();
            fitModel();
            cy.get('#graphContainer li').should('have.length', 1)
                .and('have.css', 'list-style-type', 'none')
                .and('have.css', 'color', 'rgb(13, 110, 253)').click({force: true});
            cy.get('@openGroupedLink').should('have.been.calledWith', url, '_blank', 'noopener,noreferrer');
            cy.get('#graphContainer li').dblclick({force: true});
            cy.get('.mxCellEditor li').should('have.length', 1).and('have.css', 'list-style-type', 'none')
                .click().type('{end} today{enter}');
            fitModel();
            cy.contains('#graphContainer li', edited).should('be.visible');

            cy.contains('button', 'Export').click();
            cy.contains('Export as SVG').click();
            cy.wrap(null).should(() => expect(svgFile).to.exist);
            cy.then(async () => {
                const svg = new DOMParser().parseFromString(await svgFile.text(), 'image/svg+xml');
                expect(svg.querySelector('parsererror')).to.equal(null);
                const links = Array.from(svg.querySelectorAll('a'));
                expect(links.map(link => link.getAttribute('href'))).to.deep.equal([rootUrl, url]);
                expect(links[1].querySelector('li')!.textContent).to.equal(edited);
                expect(links[1].querySelector('li')!.style.listStyleType).to.equal('none');
            });
            cy.contains('button', 'Export').click();
            cy.contains('Export as PNG').click();
            cy.wrap(null).should(() => {
                expect(pngFile.type).to.equal('image/png');
                expect(pngFile.size).to.be.greaterThan(1000);
            });
            cy.get('#graphContainer a').should('not.exist');
            cy.contains('button', /^Save$/).click();
            cy.wrap(null).should(() => {
                expect(JSON.parse(saved).treeData.find((goal: {id: number}) => goal.id === 2))
                    .to.include({content: edited, url});
            });

            cy.visit('/');
            cy.contains('button', 'Open Model').click();
            cy.then(() => cy.get('input[type="file"]').selectFile({
                contents: Cypress.Buffer.from(saved), fileName: 'linked-list.json', mimeType: 'application/json',
            }, {force: true}));
            cy.contains('button', /^Upload$/).click();
            cy.get('#graphTab').click();
            fitModel();
            cy.window().then(window => cy.stub(window, 'open').as('reopenedLink'));
            cy.get('#graphContainer li').should('have.length', 1)
                .and('have.text', edited).and('have.css', 'list-style-type', 'none').click({force: true});
            cy.get('@reopenedLink').should('have.been.calledWith', url, '_blank', 'noopener,noreferrer');
        });
    }
});
