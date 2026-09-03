type ExportedFile = {
  name: string;
  data: Blob | string;
};

describe('Graph export tests', () => {
  it('exports list labels to PNG while preserving SVG export', () => {
    const exportedFiles: ExportedFile[] = [];
    let visibleLabels: string[] = [];

    cy.visit('/');
    cy.contains('Create Model').click();

    cy.window().then((window) => {
      Object.defineProperty(window, 'showSaveFilePicker', {
        configurable: true,
        value: async (options: SaveFilePickerOptions) => ({
          createWritable: async () => ({
            write: async (data: Blob | string) => {
              exportedFiles.push({
                name: options.suggestedName ?? '',
                data,
              });
            },
            close: async () => undefined,
          }),
        }),
      });
    });

    cy.get('#graphTab').click();
    cy.get('#graphContainer li').should('have.length', 3);
    cy.get('#graphContainer li').then(($labels) => {
      visibleLabels = Array.from($labels).map(label => label.textContent ?? '');
    });

    cy.contains('Export').click();
    cy.contains('Export as PNG').click();
    cy.wrap(null).should(() => {
      expect(exportedFiles.some(file => file.name === 'Graph.png')).to.equal(true);
    });

    cy.get('#graphContainer svg').then(($svg) => {
      const svg = $svg[0] as unknown as SVGSVGElement;
      const svgRect = svg.getBoundingClientRect();
      const labelRects = Array.from(svg.querySelectorAll('li')).map(label => {
        const rect = label.getBoundingClientRect();
        return {
          x: rect.left - svgRect.left,
          y: rect.top - svgRect.top,
          width: rect.width,
          height: rect.height,
        };
      });
      const png = exportedFiles.find(file => file.name === 'Graph.png')!.data as Blob;

      return cy.window().then(async (window) => {
        const imageUrl = window.URL.createObjectURL(png);
        const image = new window.Image();
        image.src = imageUrl;
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error('Failed to load exported PNG'));
        });

        const canvas = window.document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        const scaleX = image.naturalWidth / svgRect.width;
        const scaleY = image.naturalHeight / svgRect.height;

        labelRects.forEach(rect => {
          const pixels = context.getImageData(
            Math.max(0, Math.floor(rect.x * scaleX)),
            Math.max(0, Math.floor(rect.y * scaleY)),
            Math.max(1, Math.ceil(rect.width * scaleX)),
            Math.max(1, Math.ceil(rect.height * scaleY)),
          ).data;
          let darkPixels = 0;

          for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index] < 80 && pixels[index + 1] < 80 && pixels[index + 2] < 80) {
              darkPixels++;
            }
          }

          expect(darkPixels).to.be.greaterThan(5);
        });

        window.URL.revokeObjectURL(imageUrl);
      });
    });

    // PNG preparation must not add export-only elements to the live graph.
    cy.get('#graphContainer svg > rect[fill="white"]').should('not.exist');

    cy.contains('Export').click();
    cy.contains('Export as SVG').click();
    cy.wrap(null).should(() => {
      expect(exportedFiles.some(file => file.name === 'Graph.svg')).to.equal(true);
    });
    cy.then(async () => {
      const svg = exportedFiles.find(file => file.name === 'Graph.svg')!.data as Blob;
      const svgText = await svg.text();

      expect(svgText).to.include('foreignObject');
      visibleLabels.forEach(label => {
        expect(svgText).to.include(`<li>${label}</li>`);
      });
    });
  });
});
