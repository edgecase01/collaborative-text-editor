import { UsersIcon } from "./Icons";

export default function StatusBar({
  cursorInfo,
  text,
  revision,
  stateName,
  isConnected,
  peerCount,
  onOpenShare
}) {
  const characters = text.length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  function getStateDisplay() {
    switch (stateName) {
      case "AWAITING_CONFIRM":
        return { label: "Sending edit...", className: "status-pending" };
      case "AWAITING_WITH_BUFFER":
        return { label: "Buffering edits...", className: "status-buffered" };
      case "SYNCHRONIZED":
      default:
        return { label: "Synced", className: "status-synced" };
    }
  }

  const stateDisplay = getStateDisplay();

  return (
    <footer className="status-bar">
      <div className="status-bar-left">
        <div
          className="status-item connection"
          title={isConnected ? "Connected to OT server" : "Disconnected"}
        >
          <span className={`status-dot ${isConnected ? "online" : "offline"}`} />
          <span>{isConnected ? "Connected" : "Offline"}</span>
        </div>

        <div className="status-item ot-state">
          <span className={`ot-indicator ${stateDisplay.className}`} />
          <span>{stateDisplay.label}</span>
        </div>

        <div className="status-item revision">
          <span>r{revision}</span>
        </div>

        <button
          className="status-item peer-status-btn"
          onClick={onOpenShare}
          title="Click to invite peers or copy room link"
        >
          <UsersIcon />
          <span>{peerCount} {peerCount === 1 ? "peer" : "peers"}</span>
        </button>
      </div>

      <div className="status-bar-right">
        <div className="status-item cursor-pos">
          <span>Ln {cursorInfo.line}, Col {cursorInfo.col}</span>
        </div>

        <div className="status-item counts">
          <span>{words} words</span>
          <span className="dot-divider">•</span>
          <span>{characters} chars</span>
        </div>

        <div className="status-item encoding">
          <span>Spaces: 2</span>
          <span className="dot-divider">•</span>
          <span>UTF-8</span>
        </div>
      </div>
    </footer>
  );
}
