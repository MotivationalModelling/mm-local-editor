import React, {useLayoutEffect, useRef} from "react";

import "./SpellcheckGoalInput.css";

type SpellcheckGoalInputProps = {
    value: string;
    placeholder: string;
    className?: string;
    draggable?: boolean;
    "aria-label": string;
    "aria-invalid"?: boolean;
    onBlur: () => void;
    onChange: (value: string) => void;
    onDragStart: () => void;
    onFocus: () => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
};

const setRef = (
    ref: React.ForwardedRef<HTMLDivElement>,
    element: HTMLDivElement | null,
) => {
    if (typeof ref === "function") {
        ref(element);
    } else if (ref) {
        ref.current = element;
    }
};

/**
 * A stable editing host allows the browser to retain its spelling annotations
 * when focus moves to another goal. React only writes to the DOM when the
 * requested value actually differs from the visible text.
 */
const SpellcheckGoalInput = React.forwardRef<HTMLDivElement, SpellcheckGoalInputProps>(({
    value,
    placeholder,
    className = "",
    draggable = false,
    "aria-label": ariaLabel,
    "aria-invalid": ariaInvalid,
    onBlur,
    onChange,
    onDragStart,
    onFocus,
    onKeyDown,
}, forwardedRef) => {
    const editorRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        const editor = editorRef.current;

        if (editor && editor.textContent !== value) {
            editor.textContent = value;
        }
    }, [value]);

    return (
        <div
            ref={(element) => {
                editorRef.current = element;
                setRef(forwardedRef, element);
            }}
            role="textbox"
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            aria-multiline="false"
            className={`form-control spellcheck-goal-input ${className}`}
            contentEditable="plaintext-only"
            suppressContentEditableWarning
            spellCheck
            data-placeholder={placeholder}
            draggable={draggable}
            onDragStart={onDragStart}
            onFocus={onFocus}
            onInput={(event) => onChange(event.currentTarget.textContent ?? "")}
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                }

                onKeyDown(event);
            }}
            onBlur={onBlur}
        />
    );
});

SpellcheckGoalInput.displayName = "SpellcheckGoalInput";

export default SpellcheckGoalInput;
