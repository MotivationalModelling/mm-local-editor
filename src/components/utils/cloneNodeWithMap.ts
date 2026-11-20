// Record original/copy pairs during cloning, before either tree can change.
export const cloneNodeWithMap = (original: Node, copies: Map<Node, Node>): Node => {
    const copy = original.cloneNode(false);
    copies.set(original, copy);
    original.childNodes.forEach(child => copy.appendChild(cloneNodeWithMap(child, copies)));
    return copy;
};
