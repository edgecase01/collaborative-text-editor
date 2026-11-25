import { FileIcon, SunIcon, MoonIcon } from "./Icons";

export default function ActivityBar({ isDark, onToggleTheme }) {
  return (
    <nav className="activity-bar" aria-label="Activity Bar">
      <div className="activity-bar-top">
        <button className="activity-icon active" title="Explorer" aria-label="Explorer">
          <FileIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="activity-bar-bottom">
        <button
          className="activity-icon"
          onClick={onToggleTheme}
          title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          aria-label="Toggle Theme"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </nav>
  );
}
