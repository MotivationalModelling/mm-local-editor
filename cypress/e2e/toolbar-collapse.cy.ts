const toggleAndMeasure = (title: HTMLElement) => {
    const view = title.ownerDocument.defaultView!;
    const heights: number[] = [];
    const started = view.performance.now();

    title.click();

    return new Cypress.Promise<number[]>((resolve) => {
        const sample = () => {
            const content = title.nextElementSibling as HTMLElement;
            // Include the target height because headless browsers can skip painted animation frames.
            heights.push(parseFloat(content.style.height) || 0, content.getBoundingClientRect().height);
            if (view.performance.now() - started >= 500) {
                resolve(heights);
                return;
            }
            view.requestAnimationFrame(sample);
        };
        view.requestAnimationFrame(sample);
    });
};

describe("Toolbar collapse animations", () => {
    beforeEach(() => {
        cy.then(() => Cypress.automation("remote:debugger:protocol", {
            command: "Emulation.setEmulatedMedia",
            params: {features: [{name: "prefers-reduced-motion", value: "no-preference"}]}
        }));
        cy.viewport(1920, 1080);
        cy.visit("/");
        cy.contains("Create Model").click();
        cy.contains("Arrange Hierarchy / Render Model").click();
        cy.get('[data-cy="graph-canvas"]').should("be.visible");
    });

    it("reopens Zoom without growing beyond its final height", () => {
        for (let cycle = 0; cycle < 2; cycle++) {
            cy.contains(".card-subtitle", "Zoom").click();
            cy.contains(".card-subtitle", "Zoom").next().should("not.be.visible");
            cy.contains(".card-subtitle", "Zoom").then(($title) => {
                return toggleAndMeasure($title[0]).then((heights) => {
                    const finalHeight = heights[heights.length - 1];
                    expect(Math.max(...heights), "maximum animated height")
                        .to.be.at.most(finalHeight + 1);
                });
            });
        }
    });

    it("uses the current toolbar width when Zoom reopens after resizing", () => {
        for (const width of [80, 180]) {
            cy.contains(".card-subtitle", "Zoom").click();
            cy.contains(".card-subtitle", "Zoom").next().should("not.be.visible");
            cy.contains(".card-subtitle", "Zoom").then(($title) => {
                $title[0].closest<HTMLElement>(".card")!.style.width = `${width}px`;
                return toggleAndMeasure($title[0]).then((heights) => {
                    const finalHeight = heights[heights.length - 1];
                    expect(Math.max(...heights), "maximum animated height after resizing")
                        .to.be.at.most(finalHeight + 1);
                });
            });
            cy.contains(".card-subtitle", "Zoom").next().find("button").then(($buttons) => {
                const first = $buttons[0].getBoundingClientRect();
                const last = $buttons[2].getBoundingClientRect();
                if (width === 80) {
                    expect(last.top).to.be.greaterThan(first.top);
                } else {
                    expect(last.top).to.equal(first.top);
                }
            });
        }
    });
});
