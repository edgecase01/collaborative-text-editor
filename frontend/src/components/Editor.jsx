import { useEffect, useRef } from "react";

export default function Editor({
  text,
  onTextChange,
  textareaRef,
  onCursorChange
}) {
  const lineNumbersRef = useRef(null);

  const lines = text.split("\n");
  const lineCount = Math.max(1, lines.length);

  // Sync line numbers scroll with textarea scroll
  function handleScroll(e) {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
  }

  // Update cursor position line and column
  function updateCursorInfo() {
    if (!textareaRef.current || !onCursorChange) return;
    const pos = textareaRef.current.selectionStart || 0;
    const textBeforeCursor = text.slice(0, pos);
    const lineIndex = textBeforeCursor.split("\n").length;
    const lastNewline = textBeforeCursor.lastIndexOf("\n");
    const colIndex = lastNewline === -1 ? pos + 1 : pos - lastNewline;
    onCursorChange({ line: lineIndex, col: colIndex });
  }

  function handleKeyDown(e) {
    // Enable Tab key indentation inside textarea
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = "  ";

      const updated = text.substring(0, start) + spaces + text.substring(end);
      onTextChange(updated);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
        updateCursorInfo();
      });
    }
  }

  useEffect(() => {
    updateCursorInfo();
  }, [text]);

  return (
    <div className="editor-container">
      <div className="line-numbers" ref={lineNumbersRef} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i + 1} className="line-number">
            {i + 1}
          </div>
        ))}
      </div>

      <div className="editor-textarea-wrapper">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCursorInfo}
          onClick={updateCursorInfo}
          onSelect={updateCursorInfo}
          onScroll={handleScroll}
          placeholder="Start typing..."
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
