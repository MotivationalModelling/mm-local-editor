describe('Goal Input Automation', () => {
    const doList = ["Run SWEN90009", "Assess", "Teach", "Run workshops", "Two-way feedback", "Monitor progress"];
    const beList = ["Clear", "Helpful", "Fair"];
    const feelList = ["Good", "Confident", "Motivated"];
    const concernList = ["Pressure"];
    const whoList = ["Student", "Lecturer", "Supervisor"];
  
    const allGoals = [...doList, ...beList, ...feelList, ...concernList, ...whoList];
    console.log('All goals:', allGoals);
    
    before(() => {
      cy.visit("http://localhost:5173/mm-local-editor/");
      cy.contains("button", "Create Model").click();
    });
  
    function clickGoalList(iconAlt: string): void {
      cy.scrollTo('top');
      cy.get(`img[alt="${iconAlt}"]`)
        .should('exist')
        .scrollIntoView()
        .should("be.visible")
        .parent() // get the <a> or clickable container
        .click({ force: true });
    }
  
  
    function enterGoals(goals: string[], startIndex: number = 0): void {
      goals.forEach((goal, index) => {
        const actualIndex = startIndex + index;
        cy.get("div.input-group input.form-control")
          .eq(actualIndex)
          .should("be.visible")
          .click()
          .clear()
          .type(goal)
          .should("have.value", goal)
          .type("{enter}{enter}");
        cy.wait(1000);
      });
      
    }

    function addGoalsToHierarchy(tabName: string): void {
        cy.scrollTo('top');
        cy.get(`[id$="-tabpane-${tabName}"]`) // Matches any ID ending with -tabpane-Do
        .find('th[style="width: 1px; white-space: nowrap;"] input.form-check-input')
        .should('be.visible')
        .click();

        cy.contains("button", "Add Group").click();
        cy.wait(500);
    }

    // Follow a scenario to create a model
    // The selected scenario is based on Prof. Leon's lecture at https://youtu.be/4C_eHs5jy-Q
    // And to reproduce the issue #89: https://github.com/MotivationalModelling/mm-local-editor/issues/89
    it("adds all goals to respective lists", () => {
      clickGoalList("Do icon");
      enterGoals(doList, 0);
      addGoalsToHierarchy("Do");
    
      clickGoalList("Be icon");
      enterGoals(beList, doList.length + 1);
      addGoalsToHierarchy("Be");
    
      clickGoalList("Feel icon");
      enterGoals(feelList, doList.length + beList.length + 2);
      addGoalsToHierarchy("Feel");
    
      clickGoalList("Concern icon");
      enterGoals(concernList, doList.length + beList.length + feelList.length + 3);
      addGoalsToHierarchy("Concern");
    
      clickGoalList("Who icon");
      enterGoals(whoList, doList.length + beList.length + feelList.length + concernList.length + 4);
      addGoalsToHierarchy("Who");
    });
  });
