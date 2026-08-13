import {describe, expect, it} from "vitest";
import {getBasename} from "./basename";

describe("getBasename", () => {
    it("uses the deploy basename when the path starts with /mm-local-editor", () => {
        expect(getBasename("/mm-local-editor/")).toBe("/mm-local-editor");
        expect(getBasename("/mm-local-editor/projectEdit")).toBe("/mm-local-editor");
    });

    it("uses the root when opened at the root, e.g. localhost or a raw IP", () => {
        expect(getBasename("/")).toBe("/");
        expect(getBasename("/projectEdit")).toBe("/");
    });
});
