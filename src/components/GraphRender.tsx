import React, { useEffect, useRef, useState } from "react";
import {
  Graph,
  Codec,
  xmlUtils,
  GraphDataModel,
  ModelXmlSerializer,
  Geometry,
  Cell,
} from "@maxgraph/core";

/* declare global {
  interface Window {
    GraphDataModel: typeof GraphDataModel;
    Cell: typeof Cell;
    Geometry: typeof Geometry;
  }
}

window.GraphDataModel = GraphDataModel;
window.Cell = Cell;
window.Geometry = Geometry; */

const GraphRender = ({ xml }: { xml: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // useEffect is called twice under <React.StrictMode> mode
  const mountRef = useRef(false);

  useEffect(() => {
    // prevent executing useEffect twice
    if (mountRef.current) return;
    mountRef.current = true;
    console.log(xml);
    if (!containerRef.current || !xml) return;

    const graph = new Graph(containerRef.current);
    graph.setPanning(true); // Use mouse right button for panning

    // Gets the default parent for inserting new cells. This
    // is normally the first child of the root (ie. layer 0).
    const parent = graph.getDefaultParent();

    // WARN: this is an experimental feature that is subject to change (class and method names).
    // see https://maxgraph.github.io/maxGraph/api-docs/classes/ModelXmlSerializer.html
    new ModelXmlSerializer(graph.getDataModel()).import(xml);

    const doc = xmlUtils.parseXml(xml);

    const codec = new Codec(doc);

    let elt = doc.documentElement.firstChild;
    const cells = [];

    while (elt != null && elt.nodeType === Node.ELEMENT_NODE) {
      let cell = codec.decode(elt as Element);
      cells.push(cell);
      elt = elt.nextSibling;
    }

    graph.addCells(cells, parent, null, null, null);
  }, [xml]);

  return <div ref={containerRef} />;
};

export default GraphRender;
