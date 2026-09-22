import {useLayoutEffect, useRef} from "react";

type InlineStoryPhraseProps = {
  value: string;
  label: string;
  editing: boolean;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
};

const InlineStoryPhrase = ({value, label, editing, autoFocus = false, onChange, onCancel}: InlineStoryPhraseProps) => {
  const elementRef = useRef<HTMLSpanElement>(null);

  // Let the browser manage the caret. Updating React children on every input
  // would replace the text node and move the caret back to the start.
  useLayoutEffect(() => {
    if (elementRef.current && elementRef.current.textContent !== value) {
      elementRef.current.textContent = value;
    }
  }, [value]);

  useLayoutEffect(() => {
    if (editing && autoFocus) elementRef.current?.focus();
  }, [editing, autoFocus]);

  return (
    <span
      ref={elementRef}
      className="user-story-phrase--editable"
      contentEditable={editing ? "plaintext-only" : false}
      role={editing ? "textbox" : undefined}
      aria-label={editing ? label : undefined}
      aria-multiline={editing ? false : undefined}
      aria-invalid={editing && !value.trim() ? true : undefined}
      tabIndex={editing ? 0 : undefined}
      onInput={editing ? (event) => onChange(event.currentTarget.textContent ?? "") : undefined}
      onKeyDown={editing ? (event) => {
        event.stopPropagation();
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Enter") event.preventDefault();
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      } : undefined}
    />
  );
};

export default InlineStoryPhrase;
