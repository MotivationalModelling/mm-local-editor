describe('Toolbar-created goal deletion', () => {
    // maxGraph uses mouse events on macOS even when PointerEvent is available.
    const eventPrefix = Cypress.platform === 'darwin' ? 'mouse' : 'pointer';
    const eventConstructor = eventPrefix === 'mouse' ? 'MouseEvent' : 'PointerEvent';
    const freeHandle = '#graphContainer [fill="#00ff00" i]';

    const addFromToolbar = (icon: string, xFraction = 0.5, yFraction = 0.5) => {
        cy.get('#graphContainer').then(($canvas) => {
            const bounds = $canvas[0].getBoundingClientRect();
            const clientX = bounds.left + bounds.width * xFraction;
            const clientY = bounds.top + bounds.height * yFraction;
            cy.wrap({clientX, clientY}).as('dropPoint');
            cy.get(`img.mxToolbarMode[src$="/${icon}"]`).trigger(`${eventPrefix}down`, {
                button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', eventConstructor, scrollBehavior: false,
            });
            cy.get('#graphContainer').trigger(`${eventPrefix}move`, {
                clientX, clientY, buttons: 1, pointerId: 1, pointerType: 'mouse', eventConstructor, force: true,
            }).trigger(`${eventPrefix}up`, {
                clientX, clientY, button: 0, pointerId: 1, pointerType: 'mouse', eventConstructor, force: true,
            });
        });
    };

    const connectTo = (label: string) => {
        cy.get('#graphContainer text').contains(new RegExp(`^${label}$`)).then(($parent) => {
            const bounds = $parent[0].getBoundingClientRect();
            const clientX = bounds.left + bounds.width / 2;
            const clientY = bounds.top + bounds.height / 2;
            cy.get(freeHandle).trigger(`${eventPrefix}down`, {
                button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', eventConstructor, scrollBehavior: false, force: true,
            });
            cy.get('#graphContainer text').contains(new RegExp(`^${label}$`)).trigger(`${eventPrefix}move`, {
                clientX, clientY, buttons: 1, pointerId: 1, pointerType: 'mouse', eventConstructor, force: true,
            });
            cy.get('#graphContainer text').contains(new RegExp(`^${label}$`)).trigger(`${eventPrefix}up`, {
                clientX, clientY, button: 0, pointerId: 1, pointerType: 'mouse', eventConstructor, force: true,
            });
        });
    };

    beforeEach(() => {
        cy.viewport(1440, 1000);
        cy.visit('/');
        cy.contains('Create Model').click();
        cy.contains('Arrange Hierarchy / Render Model').click();
        cy.get('#graphContainer').should('be.visible');
    });


    for (const connected of [false, true]) {
        it(`removes a toolbar-created goal from the hierarchy and list with backspace${connected ? ' after connecting to a parent' : ''}`, () => {
            addFromToolbar('Function.png');
            cy.get(freeHandle).should('have.length', 1);
            cy.window().should((win) => {
                expect(JSON.parse(win.localStorage.getItem('ammber/treeData')!)).to.have.length(6);
            }).then((win) => {
                const tree = JSON.parse(win.localStorage.getItem('ammber/treeData')!);
                const id = tree[tree.length - 1].id;
                cy.wrap(id).as('newGoalId');
            });
            if (connected) {
                connectTo('Do3');
                cy.get(freeHandle).should('not.exist');
            }
            cy.get<{clientX: number; clientY: number}>('@dropPoint').then(({clientX, clientY}) => {
                cy.get('#graphContainer path[fill="#ffffff" i]').filter((_index, shape) => {
                    const bounds = shape.getBoundingClientRect();
                    return Math.abs(bounds.left - clientX) < 10 && Math.abs(bounds.top - clientY) < 10;
                }).then(($shape) => {
                    const bounds = $shape[0].getBoundingClientRect();
                    const clientX = bounds.left + bounds.width * 0.7;
                    const clientY = bounds.top + bounds.height * 0.7;
                    cy.wrap($shape).trigger(`${eventPrefix}down`, {
                        clientX, clientY, button: 0, buttons: 1, eventConstructor, force: true, scrollBehavior: false,
                    }).trigger(`${eventPrefix}up`, {
                        clientX, clientY, button: 0, eventConstructor, force: true,
                    });
                });
            });
            cy.get('body').type('{backspace}');
            cy.get<number>('@newGoalId').then((id) => {
                cy.window().should((win) => {
                    const tree = JSON.parse(win.localStorage.getItem('ammber/treeData')!);
                    const tabs = JSON.parse(win.localStorage.getItem('ammber/tabData')!);
                    type Goal = {id: number; children?: Goal[]};
                    const hasGoal = (goals: Goal[]): boolean => goals.some((goal) => goal.id === id || hasGoal(goal.children ?? []));
                    expect(hasGoal(tree), 'hierarchy entry').to.equal(false);
                    expect(tabs.flatMap((tab: {rows: {id: number}[]}) => tab.rows).some((goal: {id: number}) => goal.id === id), 'goal list entry').to.equal(false);
                });
            });
        });
    }

    it('deletes the new goal when its pending connection is still selected', () => {
        addFromToolbar('Function.png');
        cy.get(freeHandle).should('have.length', 1);
        cy.get('body').type('{backspace}');
        cy.get(freeHandle).should('not.exist');
        cy.window().should((win) => {
            expect(JSON.parse(win.localStorage.getItem('ammber/treeData')!)).to.have.length(5);
            const tabs = JSON.parse(win.localStorage.getItem('ammber/tabData')!);
            expect(tabs.find((tab: {label: string}) => tab.label === 'Do').rows).to.have.length(4);
        });
    });

});
