import type {GoalLayout} from '../../src/components/utils/modelJson';

const root = {id: 1, content: 'Root', type: 'Do', instanceId: '1:1', children: []};
const goals = ['Be', 'Feel', 'Concern', 'Who'].flatMap((type, group) =>
  ['Independent', 'Responsible', 'Able to learn from mistakes'].map((label, index) => ({
    id: 2 + group * 3 + index, content: `${type} ${label}`, type,
    instanceId: `${2 + group * 3 + index}:1`, children: [],
  })));

// maxGraph renders outlines and labels as siblings, not one group per cell.
// The eight handles identify the selected cell's rectangle unambiguously.
const shapeBounds = (label: HTMLElement) => {
  const handles = Array.from(label.ownerDocument.querySelectorAll('#graphContainer rect[fill="#00ff00"]'));
  expect(handles).to.have.length(8);
  // SVG coordinates exclude Cypress scrolling the page to reach the font input.
  const boxes = handles.map(handle => (handle as SVGGraphicsElement).getBBox());
  const xs = boxes.map(box => box.x + box.width / 2);
  const ys = boxes.map(box => box.y + box.height / 2);
  return {x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys)};
};
const label = (type = 'Be') => type === 'Do' ? cy.get('#graphContainer .goal-label-text').first()
  : type === 'Who' ? cy.contains('#graphContainer text', 'Who Independent')
  : cy.contains('#graphContainer li', `${type} Independent`);
const setSize = (size: number) => cy.contains('Font size').parent().find('input').type(`{selectall}${size}`);
const undoGraphChange = (isMac = Cypress.platform === 'darwin') => cy.get('#graphContainer')
  .trigger('keydown', {code: 'KeyZ', keyCode: 90, ctrlKey: !isMac, metaKey: isMac, force: true});
// Exercise the real resize handles. Several pointer moves still constitute one
// drag. Ratios are checked from saved bounds, including maxGraph grid snapping.
const resizeShape = (type: string, widthScale: number, heightScale = widthScale, corner = 7, steps = 1) => {
  label(type).click({force: true});
  cy.get('#graphContainer rect[fill="#00ff00"]').should('have.length', 8).then(handles => {
    const centre = (index: number) => {
      const box = handles[index].getBoundingClientRect();
      return {x: box.x + box.width / 2, y: box.y + box.height / 2};
    };
    const first = centre(0);
    const last = centre(7);
    const start = centre(corner);
    const direction = corner === 0 ? -1 : 1;
    const dx = (last.x - first.x) * (widthScale - 1) * direction;
    const dy = (last.y - first.y) * (heightScale - 1) * direction;
    const pointer = {button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', force: true};
    cy.wrap(handles[corner]).trigger('pointerdown', {...pointer, clientX: start.x, clientY: start.y});
    for (let step = 1; step <= steps; step++) {
      cy.document().trigger('pointermove', {...pointer, clientX: start.x + dx * step / steps, clientY: start.y + dy * step / steps});
    }
    cy.document().trigger('pointerup', {...pointer, buttons: 0, clientX: start.x + dx, clientY: start.y + dy});
  });
};
const expectFits = (type = 'Be', itemCount = 3) => (type === 'Do' ? label(type) : label(type).closest('ul')).should(list => {
  const bounds = list[0].getBoundingClientRect();
  const area = list[0].parentElement!.getBoundingClientRect();
  expect(bounds.top).to.be.at.least(area.top - 1);
  expect(bounds.bottom).to.be.at.most(area.bottom + 1);
  // scrollWidth/clientWidth are both unscaled CSS pixels, unlike DOMRect.
  expect(list[0].scrollWidth).to.be.at.most(list[0].clientWidth + 1);
  if (type !== 'Do') expect(list.find('li')).to.have.length(itemCount);
});

// Check rendered word boundaries, not only CSS or absence of overflow: a label
// can fit its box while incorrectly splitting a word across two lines.
const expectWholeDoWords = () => label('Do').should(elements => {
  const element = elements[0];
  const document = element.ownerDocument;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const area = element.parentElement!.getBoundingClientRect();
  let node = walker.nextNode();
  while (node) {
    for (const match of node.textContent!.matchAll(/[A-Za-z]+/g)) {
      const range = document.createRange();
      range.setStart(node, match.index!);
      range.setEnd(node, match.index! + match[0].length);
      const rectangles = Array.from(range.getClientRects()).filter(rect => rect.width > 0);
      expect(rectangles, `the word "${match[0]}" must occupy one line`).to.have.length(1);
      expect(rectangles[0].left).to.be.at.least(area.left - 1);
      expect(rectangles[0].right).to.be.at.most(area.right + 1);
    }
    node = walker.nextNode();
  }
});

// Add through the goal list while retaining the live graph and its layout.
const addPoint = (type: string, text: string) => {
  cy.contains('button', 'Show goal list').click();
  cy.contains('[role="tab"]', new RegExp(`^${type}$`)).click();
  cy.get('.tab-pane.active').find('button').last().click();
  cy.get(`.tab-pane.active input[placeholder="Enter ${type}..."]`).last()
    .type(`{selectall}${text}{enter}`, {delay: 0});
  cy.get(`.tab-pane.active input[placeholder="Enter ${type}..."]`).last()
    .closest('tr').find('input[type="checkbox"]').check();
  cy.contains('button', 'Add Group').click();
  cy.contains('button', 'Hide goal list').click();
  cy.contains(type === 'Who' ? '#graphContainer text' : '#graphContainer li', text).should('exist');
};

// Independently check tightness using the final rendered font and wrapping:
// if a 2% smaller label area still fits, the auto-growth left too much slack.
const expectTightFit = (type: string) => (type === 'Do' ? label(type) : label(type).closest('ul')).then(elements => {
  const list = elements[0];
  const document = list.ownerDocument;
  const style = document.defaultView!.getComputedStyle(list);
  const probe = document.createElement('div');
  probe.style.cssText = `position:fixed;visibility:hidden;width:${list.clientWidth * 0.98}px`;
  probe.style.font = style.font;
  probe.style.lineHeight = style.lineHeight;
  const copy = list.cloneNode(true) as HTMLElement;
  probe.appendChild(copy);
  document.body.appendChild(probe);
  try {
    const height = list.parentElement!.clientHeight * 0.98;
    expect(copy.getBoundingClientRect().height > height || copy.scrollWidth > copy.clientWidth,
      'a smaller area should no longer fit').to.equal(true);
  } finally {
    probe.remove();
  }
});

describe('Automatic shape growth for larger fonts', () => {
  let saved: string;
  const captureSave = (window: Cypress.AUTWindow) => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: window.navigator.userAgent.replace(/Electron\/\S+\s*/g, '').replace('HeadlessChrome', 'Chrome'),
    });
    Object.defineProperty(window, 'showSaveFilePicker', {value: async () => ({
      createWritable: async () => ({write: async (data: string) => {saved = data;}, close: async () => undefined}),
    })});
  };
  // Showing/hiding the goal list can fit the viewport again. Compare model
  // coordinates from Save, not selection handles at potentially different zooms.
  const saveGroupLayout = (type = 'Be') => {
    cy.then(() => {saved = '';});
    cy.contains('button', /^Save$/).click();
    cy.wrap(null).should(() => expect(saved).not.to.equal(''));
    return cy.then(() => {
      const model = JSON.parse(saved);
      if (type === 'Do') return model.functionalLayout['Functional-1:1'] as GoalLayout[string];
      const layout: GoalLayout = model.nonFunctionalLayout;
      const firstMember = goals.find(goal => goal.type === type)!.instanceId;
      const group = Object.entries(layout).find(([id]) => id.startsWith(`Nonfunctional-[${firstMember},`) || id === `Nonfunctional-[${firstMember}]`);
      expect(group, `${type} layout in saved model`).not.to.equal(undefined);
      return group![1];
    });
  };
  const openScalingModel = (appVersion?: string) => {
    saved = '';
    cy.visit('/projectEdit', {onBeforeLoad(window) {
      captureSave(window);
      if (appVersion) Object.defineProperty(window.navigator, 'appVersion', {value: appVersion});
      window.localStorage.setItem('ammber/tabData', JSON.stringify(
        ['Do', 'Be', 'Feel', 'Concern', 'Who'].map(label => ({
          label, icon: '', rows: label === 'Do' ? [root] : goals.filter(goal => goal.type === label),
        })),
      ));
      window.localStorage.setItem('ammber/treeData', JSON.stringify([root, ...goals]));
    }});
    cy.get('#graphTab').click();
    cy.contains('Font size').click();
  };
  beforeEach(() => openScalingModel());

  for (const type of ['Be', 'Feel', 'Concern']) {
    it(`centres the ${type} text column excluding bullets at small and large fonts`, () => {
      const expectCentred = (roomy = false) => label(type).closest('ul').should(elements => {
        const list = elements[0];
        const bounds = list.getBoundingClientRect();
        const area = list.parentElement!.getBoundingClientRect();
        expect(bounds.left + bounds.width / 2).to.be.closeTo(area.left + area.width / 2, 1);
        const textColumn = list.querySelector('li')!.getBoundingClientRect();
        expect(textColumn.left + textColumn.width / 2).to.be.closeTo(area.left + area.width / 2, 1);
        expect(bounds.left).to.be.at.least(area.left - 1);
        expect(bounds.right).to.be.at.most(area.right + 1);
        expect(list.ownerDocument.defaultView!.getComputedStyle(list).textAlign).to.equal('left');
        if (roomy) expect(bounds.width).to.be.lessThan(area.width - 2);
      });
      label(type).click({force: true});
      setSize(40);
      expectCentred();
      expectFits(type);
      setSize(8);
      expectCentred(true);
      resizeShape(type, 0.8);
      expectCentred();
      expectFits(type);
    });

    it(`grows ${type} proportionally around its centre and never shrinks on smaller fonts`, () => {
      label(type).click({force: true}).then(element => {
        const before = shapeBounds(element[0]);
        setSize(40).should('have.value', '40');
        cy.get('.modal.show').should('not.exist');
        label(type).should('have.css', 'font-size', '40px').then(element => {
          const after = shapeBounds(element[0]);
          expect(after.width).to.be.greaterThan(before.width);
          expect(after.width / after.height).to.be.closeTo(before.width / before.height, 0.01);
          expect(after.x + after.width / 2).to.be.closeTo(before.x + before.width / 2, 1);
          expect(after.y + after.height / 2).to.be.closeTo(before.y + before.height / 2, 1);
          expectFits(type);
          expectTightFit(type);
          setSize(8);
          label(type).then(element => expect(shapeBounds(element[0])).to.deep.equal(after));
          setSize(9);
          label(type).then(element => expect(shapeBounds(element[0])).to.deep.equal(after));
        });
      });
    });
  }

  it('rounds a pasted decimal font down in the control, rendered text, and saved model', () => {
    label().click({force: true});
    cy.contains('Font size').parent().find('input').then(elements => {
      const input = elements[0];
      const window = input.ownerDocument.defaultView!;
      // Supply the whole value as a paste would, bypassing React's value tracker.
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, '14.61');
      input.dispatchEvent(new window.Event('input', {bubbles: true}));
    }).should('have.value', '14');
    label().should('have.css', 'font-size', '14px');
    saveGroupLayout().then(layout => expect(layout.fontSize).to.equal(14));
  });

  it('undoes font and size together with Ctrl+Z on Linux', () => {
    openScalingModel('5.0 (X11; Linux x86_64)');
    label().click({force: true}).then(element => {
      const before = shapeBounds(element[0]);
      setSize(40);
      undoGraphChange(false);
      label().should('have.css', 'font-size', '16px').then(element => expect(shapeBounds(element[0])).to.deep.equal(before));
      cy.contains('Font size').parent().find('input').should('have.value', '16');
    });
  });

  it('only grows enough to fit when increasing the font one point at a time', () => {
    label().click({force: true});
    // Establish a fitting baseline before testing small subsequent increases.
    setSize(20);
    expectFits();
    for (const size of [21, 22, 23, 24, 25]) {
      label().then(element => {
        const before = shapeBounds(element[0]);
        setSize(size);
        expectFits();
        label().then(element => {
          const after = shapeBounds(element[0]);
          // Scaling a fitting label with its font is sufficient; a one-point
          // change must not cause a much larger jump from rounding artefacts.
          expect(after.width / before.width).to.be.at.most(size / (size - 1) + 0.03);
        });
      });
    }
  });

  it('measures unsaved editor text at a different zoom', () => {
    cy.contains('Zoom').parent().find('button').first().click().click();
    label('Concern').dblclick({force: true});
    cy.get('.mxCellEditor li').first().type('{end} with extra unsaved words');
    setSize(40);
    cy.get('.modal.show').should('not.exist');
    cy.get('.mxCellEditor').should('have.css', 'font-size', '40px').and('contain.text', 'extra unsaved words');
    cy.get('.mxCellEditor').type('{enter}');
    expectFits('Concern');
  });

  it('grows each selected list independently', () => {
    label().click({force: true});
    label('Concern').click({force: true, ctrlKey: true});
    setSize(40);
    for (const type of ['Be', 'Concern']) {
      label(type).should('have.css', 'font-size', '40px');
      expectFits(type);
    }
    label('Feel').should('have.css', 'font-size', '16px');
  });

  for (const type of ['Be', 'Feel', 'Concern']) {
    it(`syncs left-side ${type} edits, fitting longer text and retaining size for shorter text`, () => {
      const original = `${type} Able to learn from mistakes`;
      const longer = `${original} while working independently and collaborating with the team on unfamiliar tasks`.repeat(3);
      label(type).click({force: true});
      setSize(29);
      label(type).then(element => {
        const before = shapeBounds(element[0]);
        cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === original)
          .type(`{selectall}${longer}{enter}`, {delay: 0});
        cy.contains('#graphContainer li', longer).should('exist');
        label(type).should('have.css', 'font-size', '29px').click({force: true}).then(element => {
          const grown = shapeBounds(element[0]);
          expect(grown.width).to.be.greaterThan(before.width);
          expect(grown.width / grown.height).to.be.closeTo(before.width / before.height, 0.01);
          expect(grown.x + grown.width / 2).to.be.closeTo(before.x + before.width / 2, 1);
          expect(grown.y + grown.height / 2).to.be.closeTo(before.y + before.height / 2, 1);
          expectFits(type);
          expectTightFit(type);
          cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === longer)
            .type(`{selectall}${type} Short`).blur();
          cy.contains('#graphContainer li', `${type} Short`).should('exist');
          label(type).click({force: true}).then(element => expect(shapeBounds(element[0])).to.deep.equal(grown));
          cy.contains('button', /^Save$/).click();
          cy.wrap(null).should(() => {
            expect(saved).not.to.equal('');
            expect(saved).to.contain(`${type} Short`).and.not.contain(longer);
          });
        });
      });
    });
  }

  it('updates the left-side text after editing the graph', () => {
    label().dblclick({force: true});
    cy.get('.mxCellEditor li').first().type('{end} updated in graph');
    cy.get('.mxCellEditor').type('{enter}');
    cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === 'Be Independent updated in graph')
      .should('have.length', 1);
    cy.contains('#graphContainer li', 'Be Independent updated in graph').should('exist');
    expectFits();
  });

  it('saves and reopens the enlarged geometry and font size', () => {
    label().click({force: true});
    setSize(40);
    // Exercise persistence after a left-side text edit, not only a font change.
    cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === 'Be Responsible')
      .type('{selectall}Be Responsible for coordinating the team and completing unfamiliar tasks{enter}', {delay: 0});
    cy.contains('#graphContainer li', 'Be Responsible for coordinating').should('exist');
    expectFits();
    cy.contains('button', /^Save$/).click();
    cy.wrap(null).should(() => expect(saved).not.to.equal(''));
    cy.then(() => {
      const layout = JSON.parse(saved).nonFunctionalLayout;
      expect(Object.values(layout).some((entry: any) => entry.fontSize === 40)).to.equal(true);
      const contents = saved;
      cy.visit('/', {onBeforeLoad: captureSave});
      cy.contains('button', 'Open Model').click();
      cy.get('input[type="file"]').selectFile({contents: Cypress.Buffer.from(contents), fileName: 'grown.json'}, {force: true});
      cy.contains('button', /^Upload$/).click();
      cy.get('#graphTab').click();
      label().should('have.css', 'font-size', '40px');
      cy.contains('#graphContainer li', 'Be Responsible for coordinating').should('exist');
      expectFits();
      cy.then(() => {saved = '';});
      cy.contains('button', /^Save$/).click();
      cy.wrap(null).should(() => {
        expect(saved).not.to.equal('');
        expect(JSON.parse(saved).nonFunctionalLayout).to.deep.equal(layout);
      });
    });
  });

  it('keeps manually enlarged lists when editing another goal and allows cancelling a draft', () => {
    label().click({force: true});
    setSize(29);
    label().then(element => {
      const before = shapeBounds(element[0]);
      cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === 'Root')
        .type('{selectall}Updated root{enter}');
      // Functional labels wrap into separate SVG text nodes.
      cy.contains('#graphContainer', /Updated\s*root/).should('exist');
      label().should('have.css', 'font-size', '29px').click({force: true})
        .then(element => expect(shapeBounds(element[0])).to.deep.equal(before));
      cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === 'Be Responsible')
        .type('{selectall}Cancelled draft{esc}').should('have.value', 'Be Responsible');
      cy.contains('#graphContainer li', 'Cancelled draft').should('not.exist');
      cy.contains('#graphContainer li', 'Be Responsible').should('exist');
    });
  });

  for (const type of ['Be', 'Feel', 'Concern']) {
    it(`preserves ${type} proportions and font through font changes, text edits, and adding/removing points`, () => {
      label(type).click({force: true});
      setSize(20);
      cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === `${type} Able to learn from mistakes`)
        .type(`{selectall}${type} Able to learn{enter}`);
      label(type).click({force: true});
      setSize(29);
      expectFits(type);
      saveGroupLayout(type).then(before => {
        addPoint(type, 'playful');
        label(type).should('have.css', 'font-size', '29px');
        saveGroupLayout(type).then(after => {
          expect(after.width).to.be.at.least(before.width);
          expect(after.height).to.be.at.least(before.height);
          expect(after.width / after.height).to.be.closeTo(before.width / before.height, 0.01);
          expect(after.x + after.width / 2).to.be.closeTo(before.x + before.width / 2, 1);
          expect(after.y + after.height / 2).to.be.closeTo(before.y + before.height / 2, 1);
          expectFits(type, 4);
          cy.get('.tree-row button[aria-label="Delete playful"]').click();
          cy.contains('#graphContainer li', 'playful').should('not.exist');
          label(type).should('have.css', 'font-size', '29px');
          saveGroupLayout(type).then(layout => expect(layout).to.deep.equal(after));
          expectFits(type);
        });
      });
    });
  }

  it('grows a group with hidden connections for a long new point and saves/reopens it', () => {
    cy.contains('Line visibility').click();
    cy.get('#line-switch').uncheck();
    label().click({force: true});
    setSize(29);
    saveGroupLayout().then(before => {
      const longPoint = 'Playful while learning unfamiliar skills and working with new teammates. '.repeat(3).trim();
      addPoint('Be', longPoint);
      label().should('have.css', 'font-size', '29px');
      saveGroupLayout().then(after => {
        expect(after.width).to.be.greaterThan(before.width);
        expect(after.width / after.height).to.be.closeTo(before.width / before.height, 0.01);
        expectFits('Be', 4);
        expectTightFit('Be');
      });
      cy.contains('button', /^Save$/).click();
      cy.wrap(null).should(() => expect(saved).not.to.equal(''));
      cy.then(() => {
        const contents = saved;
        const layout = JSON.parse(saved).nonFunctionalLayout;
        cy.visit('/', {onBeforeLoad: captureSave});
        cy.contains('button', 'Open Model').click();
        cy.get('input[type="file"]').selectFile({contents: Cypress.Buffer.from(contents), fileName: 'added-point.json'}, {force: true});
        cy.contains('button', /^Upload$/).click();
        cy.get('#graphTab').click();
        cy.contains('#graphContainer li', longPoint).should('exist');
        label().should('have.css', 'font-size', '29px');
        expectFits('Be', 4);
        cy.then(() => {saved = '';});
        cy.contains('button', /^Save$/).click();
        cy.wrap(null).should(() => {
          expect(saved).not.to.equal('');
          expect(JSON.parse(saved).nonFunctionalLayout).to.deep.equal(layout);
        });
      });
    });
  });

  for (const type of ['Be', 'Feel', 'Concern']) {
    it(`shrinks a full ${type} label with four points of breathing room once per drag and rounds down`, () => {
      label(type).click({force: true});
      setSize(40);
      expectTightFit(type);
      saveGroupLayout(type).then(before => {
        resizeShape(type, 0.8, 0.8, 7, 4);
        saveGroupLayout(type).then(after => {
          const ratio = Math.min(after.width / before.width, after.height / before.height);
          expect(ratio).to.be.closeTo(0.8, 0.03);
          expect(after.fontSize).to.equal(Math.floor((40 - 4) * ratio));
          // maxGraph rounds drag coordinates to two decimal places.
          expect(after.x).to.be.closeTo(before.x, 0.01);
          expect(after.y).to.be.closeTo(before.y, 0.01);
          cy.contains('Font size').parent().find('input').should(input => {
            expect(Number(input.val())).to.equal(after.fontSize);
          });
          expectFits(type);
          // There is now room for +1, so another drag must not subtract 4 again.
          resizeShape(type, 0.9);
          saveGroupLayout(type).then(second => {
            const nextRatio = Math.min(second.width / after.width, second.height / after.height);
            expect(second.fontSize).to.equal(Math.floor(after.fontSize! * nextRatio));
          });
          expectFits(type);
        });
      });
    });
  }

  it('scales a roomy label without subtracting four and leaves manual enlargement unchanged', () => {
    label().click({force: true});
    setSize(40);
    setSize(24);
    saveGroupLayout().then(before => {
      resizeShape('Be', 0.8);
      saveGroupLayout().then(after => {
        const ratio = Math.min(after.width / before.width, after.height / before.height);
        expect(after.fontSize).to.equal(Math.floor(24 * ratio));
        expectFits();
        resizeShape('Be', 1.2);
        saveGroupLayout().then(grown => {
          expect(grown.width).to.be.greaterThan(after.width);
          expect(grown.fontSize).to.equal(after.fontSize);
        });
      });
    });
  });

  it('fits a width-only shrink at a different zoom', () => {
    label().click({force: true});
    setSize(40);
    cy.contains('Zoom').parent().find('button').first().click();
    saveGroupLayout().then(before => {
      resizeShape('Be', 0.7, 1, 4);
      saveGroupLayout().then(after => {
        expect(after.height).to.be.closeTo(before.height, 0.01);
        expect(after.fontSize).to.equal(Math.floor(36 * after.width / before.width));
        expectFits();
      });
    });
  });

  for (const type of ['Be', 'Feel', 'Concern']) {
    it(`stops ${type} shrinking at the minimum font size, including a repeated shrink`, () => {
      label(type).click({force: true});
      setSize(40);
      saveGroupLayout(type).then(before => {
        resizeShape(type, 0.05, 0.05, 0, 4);
        saveGroupLayout(type).then(after => {
          expect(after.fontSize).to.equal(8);
          expect(after.width).to.be.greaterThan(before.width * 0.05);
          expect(after.width).to.be.lessThan(before.width);
          expect(after.x + after.width).to.be.closeTo(before.x + before.width, 0.01);
          expect(after.y + after.height).to.be.closeTo(before.y + before.height, 0.01);
          expectFits(type);
          resizeShape(type, 0.5);
          saveGroupLayout(type).then(second => {
            expect(second.fontSize).to.equal(8);
            expect(second.width).to.be.closeTo(after.width, 1);
          });
          expectFits(type);
          cy.get('.modal.show').should('not.exist');
        });
      });
    });
  }

  it('undoes shrinking and its font change together without applying a second reduction', () => {
    label().click({force: true});
    setSize(40);
    saveGroupLayout().then(before => {
      resizeShape('Be', 0.8);
      undoGraphChange();
      saveGroupLayout().then(restored => expect(restored).to.deep.equal(before));
      label().should('have.css', 'font-size', '40px');
      expectFits();
    });
  });

  it('saves/reopens an integer resized font and keeps it while editing text and adding a point', () => {
    label().click({force: true});
    setSize(40);
    resizeShape('Be', 0.8);
    saveGroupLayout().then(before => {
      expect(Number.isInteger(before.fontSize)).to.equal(true);
      const contents = saved;
      cy.visit('/', {onBeforeLoad: captureSave});
      cy.contains('button', 'Open Model').click();
      cy.get('input[type="file"]').selectFile({contents: Cypress.Buffer.from(contents), fileName: 'shrunk.json'}, {force: true});
      cy.contains('button', /^Upload$/).click();
      cy.get('#graphTab').click();
      saveGroupLayout().then(reopened => expect(reopened).to.deep.equal(before));
      expectFits();
      cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === 'Be Responsible')
        .type('{selectall}Be Responsible for coordinating the team and completing unfamiliar tasks{enter}', {delay: 0});
      addPoint('Be', 'playful');
      saveGroupLayout().then(edited => {
        expect(edited.fontSize).to.equal(before.fontSize);
        expect(edited.width).to.be.at.least(before.width);
      });
      expectFits('Be', 4);
    });
  });

  it('can grow the font again after manual shrinking without triggering another reduction', () => {
    label().click({force: true});
    setSize(40);
    resizeShape('Be', 0.8);
    saveGroupLayout().then(shrunk => {
      expect(shrunk.fontSize).to.be.lessThan(40);
      label().click({force: true});
      setSize(40);
      saveGroupLayout().then(grown => {
        expect(grown.fontSize).to.equal(40);
        expect(grown.width).to.be.greaterThan(shrunk.width);
      });
      expectFits();
    });
  });

  const prepareDo = () => cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === 'Root')
    .type('{selectall}Root functional goal{enter}');

  for (const reopenBeforeMoving of [false, true]) {
    it(`preserves other goals' positions and sizes after adjusting Be and moving Do (${reopenBeforeMoving ? 'saved layout' : 'no saved layout'})`, () => {
      const child = {id: 20, instanceId: '20:1', type: 'Do', content: 'Work with code', children: []};
      const model = {
        tabData: ['Do', 'Be', 'Feel', 'Concern', 'Who'].map(type => ({
          label: type, icon: '', goalIds: type === 'Do' ? [1, 20] : goals.filter(goal => goal.type === type).map(goal => goal.id),
        })),
        treeData: [{...root, children: [child]}, ...goals],
      };
      const openModel = (contents: string) => {
        cy.visit('/', {onBeforeLoad: captureSave});
        cy.contains('button', 'Open Model').click();
        cy.get('input[type="file"]').selectFile({contents: Cypress.Buffer.from(contents), fileName: 'move-do.json'}, {force: true});
        cy.contains('button', /^Upload$/).click();
        cy.get('#graphTab').click();
      };
      openModel(JSON.stringify(model));
      cy.contains('Font size').click();
      for (const type of ['Be', 'Feel', 'Concern', 'Who']) {
        label(type).click({force: true});
        setSize(24);
      }
      // Top-left resizing changes Be's position as well as its size.
      resizeShape('Be', 1.2, 1.2, 0);
      cy.contains('#graphContainer .goal-label-text', 'Work with code').dblclick({force: true});
      cy.get('.mxCellEditor').type('{selectall}Work with existing codebase{enter}');
      cy.contains('#graphContainer .goal-label-text', 'Work with existing codebase').click({force: true});
      setSize(40);
      saveGroupLayout('Do').then(() => {
        if (reopenBeforeMoving) openModel(saved);
      });
      for (const [text, id] of [['Work with existing codebase', 'Functional-20:1'], ['Root', 'Functional-1:1'], ['Work with existing codebase', 'Functional-20:1']]) {
        saveGroupLayout('Do').then(() => {
          const before = JSON.parse(saved);
          cy.contains('#graphContainer .goal-label-text', text).scrollIntoView().then(elements => {
            const box = elements[0].getBoundingClientRect();
            const x = box.x + box.width / 2;
            const y = box.y + box.height / 2;
            const pointer = {button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', force: true};
            cy.wrap(elements).trigger('pointerdown', {...pointer, clientX: x, clientY: y});
            cy.document().trigger('pointermove', {...pointer, clientX: x + 60, clientY: y + 30});
            cy.document().trigger('pointerup', {...pointer, buttons: 0, clientX: x + 60, clientY: y + 30});
          });
          saveGroupLayout('Do').then(() => {
            const after = JSON.parse(saved);
            expect(after.functionalLayout[id].x, 'drag must actually move Do').not.to.equal(before.functionalLayout[id].x);
            for (const key of ['functionalLayout', 'nonFunctionalLayout']) {
              expect(Object.keys(after[key])).to.have.members(Object.keys(before[key]));
              for (const [cellId, layout] of Object.entries(before[key] as GoalLayout)) {
                const {width, height, fontSize} = layout;
                expect(after[key][cellId], cellId).to.include({width, height, fontSize});
                if (cellId !== id) expect(after[key][cellId], `${cellId} must not move`).to.deep.equal(layout);
              }
            }
          });
        });
      }
      saveGroupLayout('Do').then(() => {
        const before = JSON.parse(saved);
        openModel(saved);
        saveGroupLayout('Do').then(() => {
          const reopened = JSON.parse(saved);
          expect(reopened.nonFunctionalLayout).to.deep.equal(before.nonFunctionalLayout);
          expect(reopened.functionalLayout).to.deep.equal(before.functionalLayout);
        });
      });
    });
  }

  it('keeps complete Do words when growing, shrinking, editing, and reopening', () => {
    cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === 'Root')
      .type('{selectall}Understand the AMMER project{enter}');
    label('Do').click({force: true});
    for (const size of [24, 29, 40]) {
      setSize(size);
      expectWholeDoWords();
      expectFits('Do');
      expectTightFit('Do');
    }
    resizeShape('Do', 0.65);
    expectWholeDoWords();
    expectFits('Do');
    cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === 'Understand the AMMER project')
      .type('{selectall}Understand internationalization{enter}');
    expectWholeDoWords();
    expectFits('Do');
    saveGroupLayout('Do').then(before => {
      const contents = saved;
      cy.visit('/', {onBeforeLoad: captureSave});
      cy.contains('button', 'Open Model').click();
      cy.get('input[type="file"]').selectFile({contents: Cypress.Buffer.from(contents), fileName: 'whole-words.json'}, {force: true});
      cy.contains('button', /^Upload$/).click();
      cy.get('#graphTab').click();
      saveGroupLayout('Do').then(reopened => expect(reopened).to.deep.equal(before));
      expectWholeDoWords();
      expectFits('Do');
    });
  });

  it('grows Do just enough, then shrinks with four points of breathing room and undoes both changes', () => {
    prepareDo();
    label('Do').click({force: true});
    saveGroupLayout('Do').then(before => {
      setSize(40);
      expectFits('Do');
      expectTightFit('Do');
      saveGroupLayout('Do').then(grown => {
        expect(grown.width).to.be.greaterThan(before.width);
        expect(grown.width / grown.height).to.be.closeTo(before.width / before.height, 0.001);
        expect(grown.x + grown.width / 2).to.be.closeTo(before.x + before.width / 2, 0.01);
        resizeShape('Do', 0.8, 0.8, 7, 4);
        saveGroupLayout('Do').then(shrunk => {
          const ratio = Math.min(shrunk.width / grown.width, shrunk.height / grown.height);
          expect(shrunk.fontSize).to.equal(Math.floor(36 * ratio));
        });
        expectFits('Do');
        undoGraphChange();
        saveGroupLayout('Do').then(restored => expect(restored).to.deep.equal(grown));
        resizeShape('Do', 0.05, 0.05, 0, 4);
        saveGroupLayout('Do').then(small => expect(small.fontSize).to.equal(8));
        expectFits('Do');
      });
    });
  });

  it('fits a longer Do label committed directly on the canvas without changing the font', () => {
    label('Do').click({force: true});
    setSize(32);
    saveGroupLayout('Do').then(before => {
      const text = 'Understand internationalisation and coordinate development with teammates';
      label('Do').dblclick({force: true});
      cy.get('.mxCellEditor').type(`{selectall}${text}{enter}`, {delay: 0});
      label('Do').should('have.text', text).and('have.css', 'font-size', '32px');
      expectWholeDoWords();
      expectFits('Do');
      saveGroupLayout('Do').then(after => expect(after.width).to.be.greaterThan(before.width));
    });
  });

  it('syncs longer Do text without losing its font, preserves shorter edits, and round-trips its layout', () => {
    prepareDo();
    label('Do').click({force: true});
    setSize(29);
    const longer = 'Root functional goal, coordinating unfamiliar tasks and collaborating with the team. '.repeat(3).trim();
    saveGroupLayout('Do').then(before => {
      cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === 'Root functional goal')
        .type(`{selectall}${longer}{enter}`, {delay: 0});
      label('Do').should('have.text', longer).and('have.css', 'font-size', '29px');
      expectFits('Do');
      saveGroupLayout('Do').then(grown => {
        expect(grown.width).to.be.greaterThan(before.width);
        expect(grown.width / grown.height).to.be.closeTo(before.width / before.height, 0.001);
        label('Do').dblclick({force: true});
        cy.get('.mxCellEditor').type('{selectall}Root, edited in graph{enter}');
        cy.get('.modal.show').should('not.exist');
        label('Do').should('have.text', 'Root, edited in graph');
        cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === 'Root, edited in graph').should('have.length', 1);
        saveGroupLayout('Do').then(shorter => {
          expect(shorter).to.deep.equal(grown);
          const contents = saved;
          cy.visit('/', {onBeforeLoad: captureSave});
          cy.contains('button', 'Open Model').click();
          cy.get('input[type="file"]').selectFile({contents: Cypress.Buffer.from(contents), fileName: 'do.json'}, {force: true});
          cy.contains('button', /^Upload$/).click();
          cy.get('#graphTab').click();
          saveGroupLayout('Do').then(reopened => expect(reopened).to.deep.equal(shorter));
          expectFits('Do');
        });
      });
    });
  });

  it('measures unsaved Do text at a different zoom and keeps its font after another goal changes', () => {
    prepareDo();
    cy.contains('Zoom').parent().find('button').first().click();
    label('Do').dblclick({force: true});
    cy.get('.mxCellEditor').type('{end} with extra unsaved internationalization');
    setSize(40);
    cy.get('.mxCellEditor').type('{enter}');
    label('Do').should('contain.text', 'extra unsaved internationalization').and('have.css', 'font-size', '40px');
    expectWholeDoWords();
    expectFits('Do');
    saveGroupLayout('Do').then(before => {
      cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === 'Be Responsible')
        .type('{selectall}Be updated{enter}');
      saveGroupLayout('Do').then(after => expect(after).to.deep.equal(before));
    });
  });

  for (const count of [1, 3]) {
    it(`links the ${count}-person Who icon and font in both directions without a four-point reduction`, () => {
      if (count === 1) {
        cy.get('.tree-row button[aria-label="Delete Who Responsible"]').click();
        cy.get('.tree-row button[aria-label="Delete Who Able to learn from mistakes"]').click();
      }
      label('Who').click({force: true});
      saveGroupLayout('Who').then(before => {
        setSize(24);
        saveGroupLayout('Who').then(grown => {
          expect(grown.fontSize).to.equal(24);
          expect(grown.width / before.width).to.be.closeTo(24 / 16, 0.001);
          expect(grown.height / before.height).to.be.closeTo(24 / 16, 0.001);
          expect(grown.x + grown.width / 2).to.be.closeTo(before.x + before.width / 2, 0.01);
          label('Who').then(text => {
            const bottomHandle = text[0].ownerDocument.querySelectorAll('#graphContainer rect[fill="#00ff00"]')[7];
            expect(text[0].getBoundingClientRect().top).to.be.at.least(bottomHandle.getBoundingClientRect().top - 2);
          });
          resizeShape('Who', 0.8);
          saveGroupLayout('Who').then(shrunk => {
            const ratio = Math.min(shrunk.width / grown.width, shrunk.height / grown.height);
            expect(shrunk.fontSize).to.equal(Math.floor(24 * ratio));
            undoGraphChange();
            saveGroupLayout('Who').then(restored => expect(restored).to.deep.equal(grown));
          });
          resizeShape('Who', 1.2);
          saveGroupLayout('Who').then(larger => {
            const ratio = Math.min(larger.width / grown.width, larger.height / grown.height);
            expect(larger.fontSize).to.equal(Math.floor(24 * ratio));
          });
          setSize(8);
          resizeShape('Who', 0.5);
          saveGroupLayout('Who').then(small => expect(small.fontSize).to.equal(8));
        });
      });
    });
  }

  it('preserves Who layout through text edits, membership changes, and saving/reopening', () => {
    label('Who').click({force: true});
    setSize(24);
    saveGroupLayout('Who').then(before => {
      cy.get('.tree-row__input').filter((_, input) => (input as HTMLInputElement).value === 'Who Responsible')
        .type('{selectall}Who Responsible for coordinating a much larger team{enter}', {delay: 0});
      saveGroupLayout('Who').then(after => expect(after).to.deep.equal(before));
      addPoint('Who', 'Another colleague');
      saveGroupLayout('Who').then(after => {
        expect(after).to.deep.equal(before);
        const contents = saved;
        cy.visit('/', {onBeforeLoad: captureSave});
        cy.contains('button', 'Open Model').click();
        cy.get('input[type="file"]').selectFile({contents: Cypress.Buffer.from(contents), fileName: 'who.json'}, {force: true});
        cy.contains('button', /^Upload$/).click();
        cy.get('#graphTab').click();
        saveGroupLayout('Who').then(reopened => expect(reopened).to.deep.equal(after));
      });
    });
  });
});
