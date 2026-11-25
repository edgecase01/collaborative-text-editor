import { useState } from "react";
import { LinkIcon, CopyIcon, CheckIcon, CloseIcon, UsersIcon } from "./Icons";

export default function ShareModal({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  peerCount
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const roomUrl = `${window.location.origin}/?doc=${documentId}`;

  function handleCopy() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(roomUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    const input = document.getElementById("room-share-input");
    if (input) {
      input.select();
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <LinkIcon className="modal-icon" />
            <h3 className="modal-title">Share Room</h3>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <div className="room-info-card">
            <div className="room-info-row">
              <span className="room-info-label">Active Document</span>
              <span className="room-info-value">{documentTitle || `Doc #${documentId}`}</span>
            </div>
            <div className="room-info-row">
              <span className="room-info-label">Room ID</span>
              <span className="room-info-value font-mono">#{documentId}</span>
            </div>
            <div className="room-info-row">
              <span className="room-info-label">Connected Peers</span>
              <span className="room-info-value peer-badge">
                <UsersIcon />
                <span>{peerCount} {peerCount === 1 ? "peer" : "peers"} online</span>
              </span>
            </div>
          </div>

          <div className="share-field-group">
            <label className="share-label" htmlFor="room-share-input">
              Invite Link (direct room access)
            </label>
            <div className="share-input-wrapper">
              <input
                id="room-share-input"
                type="text"
                readOnly
                value={roomUrl}
                className="share-input"
                onClick={(e) => e.target.select()}
              />
              <button
                className={`copy-btn ${copied ? "copied" : ""}`}
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <CheckIcon />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="modal-hint">
            Anyone with this link will automatically join this document room and sync keystrokes in real time with Operational Transformation.
          </p>
        </div>
      </div>
    </div>
  );
}
