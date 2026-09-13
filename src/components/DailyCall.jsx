import { useEffect, useRef } from "react";
import DailyIframe from "@daily-co/daily-js";

function DailyCall({ roomUrl, onClose }) {
  const callRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!roomUrl || !containerRef.current) return;

    const call = DailyIframe.createFrame(
      containerRef.current,
      {
        showLeaveButton: true,
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "0",
          borderRadius: "16px",
        },
      }
    );

    callRef.current = call;

    call.join({
      url: roomUrl,
    });

    call.on("left-meeting", () => {
      onClose?.();
    });

    return () => {
      call.destroy();
      callRef.current = null;
    };
  }, [roomUrl, onClose]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        right: "30px",
        bottom: "30px",
        width: "600px",
        height: "500px",
        background: "#111",
        borderRadius: "16px",
        overflow: "hidden",
        zIndex: 9999,
      }}
    />
  );
}

export default DailyCall;