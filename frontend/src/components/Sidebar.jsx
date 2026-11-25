import { useState, useRef, useEffect } from "react";
import { FileIcon, FilePlusIcon, TrashIcon, CheckIcon, CloseIcon } from "./Icons";

export default function Sidebar({
  documents,
  activeDocumentId,
  onSelectDocument,
  onCreateDocument,
  onDeleteDocument
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  function handleStartCreate() {
    setIsCreating(true);
    setNewTitle("");
  }

  function handleCancelCreate() {
    setIsCreating(false);
    setNewTitle("");
  }

  function handleSubmitCreate(e) {
    if (e) e.preventDefault();
    const title = newTitle.trim();
    if (title) {
      onCreateDocument(title);
    }
    setIsCreating(false);
    setNewTitle("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      handleSubmitCreate();
    } else if (e.key === "Escape") {
      handleCancelCreate();
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Explorer</span>
        <button
          className="icon-btn"
          onClick={handleStartCreate}
          title="New File"
          aria-label="New File"
        >
          <FilePlusIcon />
        </button>
      </div>

      <div className="file-section">
        <div className="file-section-header">
          <span className="section-label">FILES</span>
          <span className="file-count">{documents.length}</span>
        </div>

        <div className="file-list">
          {isCreating && (
            <div className="file-item creating">
              <FileIcon className="file-icon" />
              <input
                ref={inputRef}
                type="text"
                className="file-input"
                placeholder="filename.txt"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="icon-btn-subtle"
                onClick={handleSubmitCreate}
                title="Confirm"
              >
                <CheckIcon />
              </button>
              <button
                className="icon-btn-subtle"
                onClick={handleCancelCreate}
                title="Cancel"
              >
                <CloseIcon />
              </button>
            </div>
          )}

          {documents.map((doc) => {
            const isActive = doc.id === activeDocumentId;
            return (
              <div
                key={doc.id}
                className={`file-item ${isActive ? "active" : ""}`}
                onClick={() => onSelectDocument(doc.id)}
              >
                <FileIcon className="file-icon" />
                <span className="file-name" title={doc.title}>
                  {doc.title}
                </span>

                {documents.length > 1 && (
                  <button
                    className="file-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(doc.id);
                    }}
                    title="Delete File"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
