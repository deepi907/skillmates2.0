function ActivityWindow({ activity, onClose }) {
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const activityTitle =
    activity === "chaos" ? "🤯 Chaos Mode" : "🌈 Color Hunt";

  return (
    <div
      className={`activity-window ${
        minimized ? "activity-window-minimized" : ""
      } ${maximized ? "activity-window-maximized" : ""}`}
    >
      <div className="activity-window-header">
        <div className="activity-window-title">
          {activityTitle}
        </div>

        <div className="activity-window-controls">
          <button onClick={() => setMinimized(!minimized)}>
            −
          </button>

          <button
            onClick={() => {
              setMaximized(!maximized);
              setMinimized(false);
            }}
          >
            □
          </button>

          <button onClick={onClose}>
            ×
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="activity-window-body">
          <CloudShader
            speed={0.2}
            count={5}
            cloudColor="#ffffff"
            skyTopColor="#10251b"
            skyBottomColor="#06120d"
          />

          <div className="activity-window-content">
            {activity === "chaos" && (
              <div className="chaos-content">
                {/* Ballpit will go here */}
                <h2>Chaos Mode</h2>
              </div>
            )}

            {activity === "color" && (
              <div className="color-content">
                <h2>Color Hunt</h2>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}