const MAGIC_MARKER = "MMEDITOR_PROJECT_DATA::";

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();

// Serialize project data to its wire form: a UTF-8 JSON string.
const serialize = (projectData: unknown): string =>
    JSON.stringify(projectData);

// Encode UTF-8 bytes as base64, which stays within XML-safe characters.
const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

// Decode base64 back to UTF-8 bytes.
const base64ToBytes = (base64: string): Uint8Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

// Locate the last occurrence of `needle` bytes inside `haystack`.
const lastIndexOfBytes = (
    haystack: Uint8Array,
    needle: Uint8Array
): number => {
    const limit = haystack.length - needle.length;

    for (let i = limit; i >= 0; i--) {
        let matches = true;

        for (let j = 0; j < needle.length; j++) {
            if (haystack[i + j] !== needle[j]) {
                matches = false;
                break;
            }
        }

        if (matches) {
            return i;
        }
    }

    return -1;
};

/** ---------- PNG ---------- */

// PNG is a binary container, so the JSON bytes are appended raw after the
// IEND chunk. Decoders ignore trailing bytes and the image still renders.
export async function embedJsonInPng(
    pngBlob: Blob,
    projectData: unknown
): Promise<Blob> {
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    const jsonBytes = utf8Encoder.encode(
        MAGIC_MARKER + serialize(projectData)
    );

    const combined = new Uint8Array(
        pngBytes.length + jsonBytes.length
    );
    combined.set(pngBytes, 0);
    combined.set(jsonBytes, pngBytes.length);

    return new Blob([combined], {type: "image/png"});
}

export async function extractJsonFromPng(
    file: File | Blob
): Promise<unknown | null> {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const marker = utf8Encoder.encode(MAGIC_MARKER);
    const idx = lastIndexOfBytes(buffer, marker);

    if (idx === -1) {
        return null;
    }

    try {
        return JSON.parse(
            utf8Decoder.decode(
                buffer.subarray(idx + marker.length)
            )
        );
    } catch {
        return null;
    }
}

/** ---------- SVG ---------- */

// SVG is an XML text container, so the JSON is base64-encoded into a
// <metadata> element to keep it within XML-safe characters.
export function embedJsonInSvg(
    svgString: string,
    projectData: unknown
): string {
    const doc = new DOMParser().parseFromString(
        svgString,
        "image/svg+xml"
    );
    const svgEl = doc.documentElement;

    const metadataEl = doc.createElementNS(
        "http://www.w3.org/2000/svg",
        "metadata"
    );
    metadataEl.setAttribute("id", "mm-editor-project-data");
    metadataEl.textContent = bytesToBase64(
        utf8Encoder.encode(serialize(projectData))
    );
    svgEl.insertBefore(metadataEl, svgEl.firstChild);

    return new XMLSerializer().serializeToString(doc);
}

export async function extractJsonFromSvg(
    file: File | Blob
): Promise<unknown | null> {
    const text = await file.text();
    const doc = new DOMParser().parseFromString(
        text,
        "image/svg+xml"
    );
    const metadataEl = doc.getElementById("mm-editor-project-data");

    if (!metadataEl?.textContent) {
        return null;
    }

    try {
        return JSON.parse(
            utf8Decoder.decode(
                base64ToBytes(metadataEl.textContent)
            )
        );
    } catch {
        return null;
    }
}
