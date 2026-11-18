import type {TreeGoal} from "../../src/components/utils/types";

const renderNestedGoal = (name: string) => {
    cy.visit("/");
    cy.contains("Create Model").click();
    cy.window().then((win) => {
        const tree: TreeGoal[] = JSON.parse(win.localStorage.getItem("ammber/treeData")!);
        const goal = tree.find((item) => item.content === name)!;
        const remaining = tree.filter((item) => item !== goal);
        remaining[0].children![0].children!.push(goal);
        win.localStorage.setItem("ammber/treeData", JSON.stringify(remaining));
    });
    cy.reload();
    cy.contains("Arrange Hierarchy / Render Model").click();
    cy.get("#graphContainer text, #graphContainer li").contains(new RegExp(`^${name}$`)).click({force: true});
    cy.contains("Colour").click();
};

const expectRenderedColor = (color: string) => {
    cy.get("#graphContainer path").should(($paths) => {
        expect(Array.from($paths).some((path) => path.getAttribute("fill")?.toLowerCase() === color)).to.equal(true);
    });
};

describe("Colors for nested goals", () => {
    ["Be", "Feel", "Who", "Concern"].forEach((name) => {
        it(`colors a nested ${name} goal and retains the color after refresh`, () => {
            renderNestedGoal(name);
            cy.get('#graphContainer path').then(paths => {
                const geometry = (elements: JQuery<HTMLElement>) => Array.from(elements)
                    .filter(path => path.getAttribute('fill') !== 'none')
                    .map(path => path.getAttribute('d'));
                const before = geometry(paths);
                cy.get('[aria-label="High priority colour"]').click();
                // Rendering may replace DOM nodes, but colour must not change layout or selection.
                cy.get('#graphContainer path').should(updatedPaths => {
                    expect(geometry(updatedPaths)).to.deep.equal(before);
                });
                cy.get('#graphContainer rect[fill="#00ff00"]').should('have.length', 8);
            });
            expectRenderedColor("#db3545");

            cy.reload();
            cy.contains("Arrange Hierarchy / Render Model").click();
            expectRenderedColor("#db3545");
        });
    });

    it("applies a custom palette color to a nested goal", () => {
        renderNestedGoal("Feel");
        cy.contains("button", "Custom…").click();
        cy.get('.compact-picker [title="#4D4D4D"]').click();
        expectRenderedColor("#4d4d4d");
    });
});
