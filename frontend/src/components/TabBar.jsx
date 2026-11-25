import { FileIcon, UsersIcon, ShareIcon } from "./Icons";

export default function TabBar({
  activeDocument,
  syncStatus,
  isConnected,
  peerCount,
  onOpenShare
}) {
  if (!activeDocument) return <div className="tab-bar empty" />;

  return (
    <div className="tab-bar">
      <div className="tab-item active">
        <FileIcon className="tab-icon" />
        <span className="tab-title">{activeDocument.title}</span>
        {syncStatus === "syncing" && (
          <span className="sync-pulse-dot" title="Syncing with peers..." />
        )}
      </div>

      <div className="tab-bar-spacer" />

      <div className="tab-bar-actions">
        {/* Peer Presence & Share Button */}
        <button
          className="share-trigger-btn"
          onClick={onOpenShare}
          title="Share room link to collaborate with peers"
        >
          <ShareIcon />
          <span>Share</span>
          <span className="peer-pill">
            <UsersIcon />
            <span>{peerCount}</span>
          </span>
        </button>

        {/* Live Status indicator */}
        <div
          className="connection-pill"
          title={isConnected ? "WebSocket Connected" : "Connecting..."}
        >
          <span
            className={`status-indicator ${isConnected ? "online" : "offline"}`}
          />
          <span className="connection-text">
            {isConnected ? "Live" : "Reconnecting"}
          </span>
        </div>
      </div>
    </div>
  );
}
