import { useEffect, useRef, useState } from "react";
import "./UserDashboard.css";
import Chat from "../components/Chat";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import Interests from "./Interests";
import CloudShader from "./CloudShader";
import ColorHunt from "./ColorHunt";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
const API_URL = import.meta.env.VITE_API_URL;
// ==========================================
// LEAFLET MARKER ICON FIX
// ==========================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ==========================================
// RECENTER MAP WHEN USER LOCATION CHANGES
// ==========================================

function RecenterMap({ location }) {
  const map = useMap();

  useEffect(() => {
    if (
      location?.latitude !== undefined &&
      location?.longitude !== undefined
    ) {
      map.flyTo(
        [location.latitude, location.longitude],
        13,
        {
          animate: true,
          duration: 1.5,
        }
      );
    }
  }, [location, map]);

  return null;
}
// ==========================================
// CHAOS DRAWING CANVAS
// ==========================================

function ChaosDrawingCanvas({
  strokes,
  onStrokeComplete,
  interactive = false,
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef([]);

  // Draw all saved strokes
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffffff";

    strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length < 2) {
        return;
      }

      ctx.beginPath();

      ctx.moveTo(
        stroke.points[0].x,
        stroke.points[0].y
      );

      stroke.points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });

      ctx.stroke();
    });
  }, [strokes]);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x:
        ((event.clientX - rect.left) /
          rect.width) *
        canvas.width,

      y:
        ((event.clientY - rect.top) /
          rect.height) *
        canvas.height,
    };
  };

  const handlePointerDown = (event) => {
    if (!interactive) return;

    event.preventDefault();

    drawingRef.current = true;

    const point = getPoint(event);

    currentStrokeRef.current = [point];
  };

  const handlePointerMove = (event) => {
    if (!interactive || !drawingRef.current) {
      return;
    }

    event.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const point = getPoint(event);

    const points = currentStrokeRef.current;

    const previousPoint =
      points[points.length - 1];

    points.push(point);

    ctx.beginPath();

    ctx.moveTo(
      previousPoint.x,
      previousPoint.y
    );

    ctx.lineTo(point.x, point.y);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!interactive || !drawingRef.current) {
      return;
    }

    drawingRef.current = false;

    const points = currentStrokeRef.current;

    if (points.length > 1) {
      onStrokeComplete({
        points,
      });
    }

    currentStrokeRef.current = [];
  };

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={350}
      className="chaos-drawing-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        touchAction: "none",
        cursor: interactive
          ? "crosshair"
          : "default",
      }}
    />
  );
}
function ActivityWindow({ activity, onClose }) {
  const joinChaosRoom = useMutation(api.chaosRooms.joinRoom);
  
  const createChaosRoom = useMutation(api.chaosRooms.createRoom);
const startChaosGame = useMutation(api.chaosRooms.startGame);
const updateChaosDrawing = useMutation(
  api.chaosRooms.updateDrawing
);

const submitChaosDrawing = useMutation(
  api.chaosRooms.submitDrawing
);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [joinCode, setJoinCode] = useState("");
const [joinError, setJoinError] = useState("");
  const [chaosRoom, setChaosRoom] = useState(null);
const [chaosScreen, setChaosScreen] = useState("home");
const [chaosPlayerRole, setChaosPlayerRole] = useState(null);
const [myChaosStrokes, setMyChaosStrokes] = useState([]);
  const roomData = useQuery(
  api.chaosRooms.getRoom,
  chaosRoom?.roomId
    ? { roomId: chaosRoom.roomId }
    : "skip"
);
const [timeLeft, setTimeLeft] = useState(60);
useEffect(() => {
  if (roomData?.status === "playing") {
    setChaosScreen("game");
  }
}, [roomData?.status]);

useEffect(() => {
  if (
    roomData?.status !== "playing" ||
    !roomData?.gameStartedAt ||
    !roomData?.gameDuration
  ) {
    return;
  }

  const updateTimer = () => {
    const elapsed =
      Math.floor(
        (Date.now() - roomData.gameStartedAt) / 1000
      );

    const remaining = Math.max(
      0,
      roomData.gameDuration - elapsed
    );

    setTimeLeft(remaining);
  };

  updateTimer();

  const timer = setInterval(updateTimer, 250);

  return () => clearInterval(timer);
}, [
  roomData?.status,
  roomData?.gameStartedAt,
  roomData?.gameDuration,
]);

const handleChaosStroke = async (stroke) => {
  const updatedStrokes = [
    ...myChaosStrokes,
    stroke,
  ];

  console.log("SENDING DRAWING:", {
    role: chaosPlayerRole,
    strokes: updatedStrokes,
    roomId: chaosRoom?.roomId,
  });

  setMyChaosStrokes(updatedStrokes);

  if (!chaosRoom?.roomId || !chaosPlayerRole) {
    return;
  }

  try {
    await updateChaosDrawing({
      roomId: chaosRoom.roomId,
      player: chaosPlayerRole,
      drawing: JSON.stringify(updatedStrokes),
    });

    console.log("DRAWING SENT TO CONVEX");
  } catch (error) {
    console.error(
      "Failed to sync drawing:",
      error
    );
  }
};

const handleSubmitChaosDrawing = async () => {
  if (!chaosRoom?.roomId || !chaosPlayerRole) {
    return;
  }

  try {
    await submitChaosDrawing({
      roomId: chaosRoom.roomId,
      player: chaosPlayerRole,
    });

    console.log("Drawing submitted!");
  } catch (error) {
    console.error(
      "Failed to submit drawing:",
      error
    );
  }
};
const playerAStrokes = roomData?.drawingA
  ? JSON.parse(roomData.drawingA)
  : [];

const playerBStrokes = roomData?.drawingB
  ? JSON.parse(roomData.drawingB)
  : [];
  

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
  speed={0.35}
  count={7}
  cloudColor="#ffffff"
  skyTopColor="#1677d2"
  skyBottomColor="#b9e7ff"
/>

       <div className="activity-window-content">

{activity === "chaos" && (
  <div className="chaos-content">

    {chaosScreen === "home" && (
      <div className="chaos-card">

        <div className="chaos-icon">
          🧨
        </div>

        <h2>Chaos Mode</h2>

        <p>
          Challenge your SkillMate with unpredictable
          creative challenges.
        </p>

        <div className="chaos-examples">
          <span>🎨 Draw a cat</span>
          <span>✋ Use your other hand</span>
          <span>⏱️ Beat the timer</span>
          <span>🤪 Follow the chaos</span>
        </div>

     <button
  type="button"
  className="chaos-create-room-btn"
  onClick={async () => {
    try {
      const loggedInUser = JSON.parse(
        localStorage.getItem("skillmateUser")
      );

const result = await createChaosRoom({
  playerName:
    loggedInUser?.name ||
    loggedInUser?.username ||
    "Player",
});

setChaosRoom(result);
setChaosPlayerRole("A");
setChaosScreen("create");
console.log("Chaos room created:", result);
    } catch (error) {
      console.error("Failed to create Chaos room:", error);
    }
  }}
>
  Create Room
</button>

      <button
  type="button"
  className="chaos-join-room-btn"
  onClick={() => {
    setJoinError("");
    setChaosScreen("join");
  }}
>
  Join Room
</button>

      </div>
    )}
      
    {chaosScreen === "create" && (
      <div className="chaos-card chaos-room-card">

        <div className="chaos-icon">
          🧨
        </div>

        <h2>Chaos Room</h2>

        <p>
          Your room is ready.
          Share the code with your SkillMate.
        </p>

        <div className="chaos-room-code">
  {chaosRoom?.roomCode || "------"}
</div>

        <div className="chaos-player-list">
  <div>
    👤 Player A — {roomData?.playerA || "You"}
  </div>

  <div>
    {roomData?.playerB ? (
      <>🎮 Player B — {roomData.playerB}</>
    ) : (
      <>⏳ Player B — Waiting...</>
    )}
  </div>
</div>
<button
  type="button"
  className="chaos-copy-btn"
  onClick={async () => {
    try {
      await navigator.clipboard.writeText(
        chaosRoom?.roomCode || ""
      );

      alert("Room code copied!");
    } catch (error) {
      console.error("Failed to copy room code:", error);
    }
  }}
>
  📋 Copy Code
</button>
{roomData?.status === "playing" ? (
  <button
    type="button"
    className="chaos-start-btn"
    onClick={() => setChaosScreen("game")}
  >
    🤯 Chaos Started!
  </button>
) : roomData?.status === "ready" ? (
  <button
    type="button"
    className="chaos-start-btn"
    onClick={async () => {
      try {
        await startChaosGame({
          roomId: chaosRoom.roomId,
        });

        setChaosScreen("game");
      } catch (error) {
        console.error("Failed to start Chaos:", error);
      }
    }}
  >
    🚀 Start Chaos
  </button>
) : (
  <button
    type="button"
    className="chaos-waiting-btn"
    disabled
  >
    ⏳ Waiting for Player B...
  </button>
)}

        <button
          type="button"
          className="chaos-back-btn"
          onClick={() => setChaosScreen("home")}
        >
          ← Back
        </button>

      </div>
    )}
  {chaosScreen === "game" && (
  <div className="chaos-card chaos-game-card">

    <div className="chaos-icon">
      🤯
    </div>

    <h2>Chaos Mode</h2>

    <div className="chaos-versus">
      <span>
        👤 {roomData?.playerA || "Player A"}
      </span>

      <strong>⚡ VS ⚡</strong>

      <span>
        👤 {roomData?.playerB || "Player B"}
      </span>
    </div>

    <div className="chaos-game-challenge">
      🎨 {roomData?.challenge}
    </div>
<div className={`chaos-timer ${timeLeft <= 10 ? "chaos-timer-warning" : ""}`}>
  ⏱️ {timeLeft} seconds
</div>

    <div className="chaos-drawing-area">

      {/* PLAYER A */}
      <div className="chaos-player-drawing">
        <h3>
          👤 {roomData?.playerA || "Player A"}
        </h3>

        <ChaosDrawingCanvas
          strokes={
            chaosPlayerRole === "A"
              ? myChaosStrokes
              : playerAStrokes
          }
          onStrokeComplete={
            chaosPlayerRole === "A"
              ? handleChaosStroke
              : undefined
          }
         interactive={
  chaosPlayerRole === "A" &&
  timeLeft > 0
}
        />

        {chaosPlayerRole === "A" && (
          <p>✏️ Your drawing</p>
        )}

        {chaosPlayerRole === "B" && (
          <p>👀 Live drawing</p>
        )}
      </div>


      {/* PLAYER B */}
      <div className="chaos-player-drawing">
        <h3>
          👤 {roomData?.playerB || "Player B"}
        </h3>

        <ChaosDrawingCanvas
          strokes={
            chaosPlayerRole === "B"
              ? myChaosStrokes
              : playerBStrokes
          }
          onStrokeComplete={
            chaosPlayerRole === "B"
              ? handleChaosStroke
              : undefined
          }
        interactive={
  chaosPlayerRole === "B" &&
  timeLeft > 0
}
        />

        {chaosPlayerRole === "B" && (
          <p>✏️ Your drawing</p>
        )}

        {chaosPlayerRole === "A" && (
          <p>👀 Live drawing</p>
        )}
      </div>

    </div>

    <div className="chaos-drawing-actions">

      <button
        type="button"
        className="chaos-clear-btn"
        onClick={() => {
          setMyChaosStrokes([]);
        }}
      >
        🧹 Clear
      </button>

   <button
  type="button"
  className="chaos-send-btn"
  onClick={handleSubmitChaosDrawing}
>
  📤 Send Drawing
</button>

    </div>

    <button
      type="button"
      className="chaos-back-btn"
      onClick={() => setChaosScreen("create")}
    >
      ← Leave Game
    </button>

  </div>
)}
    {chaosScreen === "join" && (
  <div className="chaos-card chaos-room-card">

    <div className="chaos-icon">
      🎮
    </div>

    <h2>Join Chaos Room</h2>

    <p>
      Enter the room code shared by your SkillMate.
    </p>

    <input
      type="text"
      value={joinCode}
      onChange={(e) =>
        setJoinCode(e.target.value.toUpperCase())
      }
      placeholder="ENTER CODE"
      maxLength={6}
      className="chaos-room-input"
    />

    {joinError && (
      <p className="chaos-join-error">
        {joinError}
      </p>
    )}

    <button
      type="button"
      className="chaos-copy-btn"
      onClick={async () => {
        try {
          const loggedInUser = JSON.parse(
            localStorage.getItem("skillmateUser")
          );

          const result = await joinChaosRoom({
            roomCode: joinCode.trim(),
            playerName:
              loggedInUser?.name ||
              loggedInUser?.username ||
              "Player",
          });

          setChaosRoom(result);
          setChaosPlayerRole("B");
          setChaosScreen("create");

          console.log("Joined Chaos room:", result);
        } catch (error) {
          console.error("Failed to join Chaos room:", error);
          setJoinError(error.message || "Failed to join room");
        }
      }}
    >
      🚀 Join Room
    </button>

    <button
      type="button"
      className="chaos-back-btn"
      onClick={() => setChaosScreen("home")}
    >
      ← Back
    </button>

  </div>
)}
  </div>
  
)}
{activity === "color" && <ColorHunt />}
</div>
        </div>
      )}
    </div>
  );
}
function UserDashboard({ onBack, onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");

 
const [selectedActivity, setSelectedActivity] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

const [mapUsers, setMapUsers] = useState([]);
const [mapLoading, setMapLoading] = useState(false);
const [userLocation, setUserLocation] = useState(null);
const [locationLoading, setLocationLoading] = useState(false);
const [locationError, setLocationError] = useState("");

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [learning, setLearning] = useState("");

  const [profilePreview, setProfilePreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [error, setError] = useState("");
  
const [messageUsers, setMessageUsers] = useState([]);
const [messagesLoading, setMessagesLoading] = useState(false);
const [messagesError, setMessagesError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ==========================================
  // LOAD LOGGED-IN USER
  // ==========================================

  useEffect(() => {
    const storedUser = JSON.parse(
      localStorage.getItem("skillmateUser")
    );

    if (!storedUser?.id) {
      setError("Please login first.");
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/users/${storedUser.id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load profile"
          );
        }

        setUser(data);

        setName(data.name || "");
        setBio(data.bio || "");
        setLocation(data.location || "");

        setSkills(
          Array.isArray(data.skills)
            ? data.skills.join(", ")
            : ""
        );

        setLearning(
          Array.isArray(data.learning)
            ? data.learning.join(", ")
            : ""
        );

       setProfilePreview(
  data.profile_picture
    ? `${API_URL}${data.profile_picture}`
    : null
);
      } catch (err) {
        console.error(
          "Dashboard profile error:",
          err
        );

        setError(
          err.message ||
            "Could not load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);
// ==========================================
// LOAD USERS FOR MAP
// ==========================================

// ==========================================
// LOAD + UPDATE USERS FOR MAP
// ==========================================

useEffect(() => {
  if (activePage !== "map" || !user?.id) {
    return;
  }

  const loadMap = async () => {
    try {
      setMapLoading(true);

      // ------------------------------------------
      // FIRST GET CURRENT GPS + SAVE IT
      // ------------------------------------------

      await new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve();
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;

            console.log(
              "CURRENT GPS LOCATION:",
              {
                latitude,
                longitude,
              }
            );

            // Update map immediately
            setUserLocation({
              latitude,
              longitude,
            });

            try {
              // Save to PostgreSQL
              const response = await fetch(
                `${API_URL}/api/users/${user.id}/location`,
                {
                  method: "PUT",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    latitude,
                    longitude,
                  }),
                }
              );

              const data =
                await response.json();

              if (response.ok) {
                console.log(
                  "LOCATION SAVED:",
                  data.user.latitude,
                  data.user.longitude
                );

                setUser(data.user);

                const currentUser =
                  JSON.parse(
                    localStorage.getItem(
                      "skillmateUser"
                    )
                  );

                localStorage.setItem(
                  "skillmateUser",
                  JSON.stringify({
                    ...currentUser,
                    ...data.user,
                  })
                );
              } else {
                console.error(
                  "Location save failed:",
                  data.message
                );
              }
            } catch (error) {
              console.error(
                "Location save error:",
                error
              );
            }

            resolve();
          },

          (error) => {
            console.error(
              "GPS error:",
              error
            );

            setLocationError(
              "Could not get your current location."
            );

            resolve();
          },

          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          }
        );
      });

      // ------------------------------------------
      // THEN LOAD ALL USERS
      // ------------------------------------------

      const response = await fetch(
        `${API_URL}/api/users`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load map users"
        );
      }

  const usersWithLocation = data.filter((mapUser) => {
  const latitude = Number(mapUser?.latitude);
  const longitude = Number(mapUser?.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
});

      console.log(
        "USERS WITH LOCATION:",
        usersWithLocation
      );

      setMapUsers(usersWithLocation);

    } catch (error) {
      console.error(
        "Map users error:",
        error
      );
    } finally {
      setMapLoading(false);
    }
  };

  loadMap();

}, [activePage, user?.id]);


// ==========================================
// LOAD USERS FOR MESSAGES
// ==========================================

useEffect(() => {
  if (activePage !== "messages" || !user?.id) {
    return;
  }

  const loadMessageUsers = async () => {
    try {
      setMessagesLoading(true);
      setMessagesError("");

      const response = await fetch(
        `${API_URL}/api/users`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load users"
        );
      }

      const otherUsers = Array.isArray(data)
        ? data.filter(
            (messageUser) =>
              Number(messageUser.id) !== Number(user.id)
          )
        : [];

      setMessageUsers(otherUsers);

    } catch (error) {
      console.error(
        "Messages users error:",
        error
      );

      setMessagesError(
        error.message ||
          "Could not load SkillMates."
      );

    } finally {
      setMessagesLoading(false);
    }
  };

  loadMessageUsers();

}, [activePage, user?.id]);
  // ==========================================
  // PROFILE IMAGE
  // ==========================================

const handleImageChange = async (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    setError("Please select an image file.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setError(
      "Image must be smaller than 5 MB."
    );
    return;
  }

  if (!user?.id) {
    setError("User not found.");
    return;
  }

  setError("");
  setMessage("");
  setSaving(true);

  // Show preview immediately
  const imageURL = URL.createObjectURL(file);
  setProfilePreview(imageURL);

  try {
    const formData = new FormData();

    formData.append(
      "profile_picture",
      file
    );

    const response = await fetch(
      `${API_URL}/api/users/${user.id}/profile-picture`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to upload profile picture"
      );
    }

    // Backend returns /uploads/filename
    const imageUrl =
      `${API_URL}${data.user.profile_picture}`;

    setProfilePreview(imageUrl);

    setUser(data.user);

    // Update localStorage
    const currentUser = JSON.parse(
      localStorage.getItem("skillmateUser")
    );

    localStorage.setItem(
      "skillmateUser",
      JSON.stringify({
        ...currentUser,
        ...data.user,
        profile_picture:
          data.user.profile_picture,
      })
    );

    setMessage(
      "Profile picture updated successfully! 💚"
    );

  } catch (err) {
    console.error(
      "Profile picture upload error:",
      err
    );

    setError(
      err.message ||
        "Could not upload profile picture."
    );

  } finally {
    setSaving(false);
  }
};

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSave = async (event) => {
    event.preventDefault();

    if (!user?.id) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const skillsArray = skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const learningArray = learning
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const response = await fetch(
        `${API_URL}/api/users/${user.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            bio,
            location,
            skills: skillsArray,
            learning: learningArray,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update profile"
        );
      }

      setUser(data.user);

      const currentUser = JSON.parse(
        localStorage.getItem("skillmateUser")
      );

      localStorage.setItem(
        "skillmateUser",
        JSON.stringify({
          ...currentUser,
          ...data.user,
        })
      );

      setMessage(
        "Profile updated successfully! 💚"
      );
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err.message ||
          "Could not update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE ACCOUNT
  // ==========================================

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
           `${API_URL}/api/users/${user.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete account"
        );
      }

      localStorage.removeItem(
        "skillmateUser"
      );

      if (onLogout) {
        onLogout();
      }
    } catch (err) {
      console.error(
        "Delete account error:",
        err
      );

      setError(
        err.message ||
          "Could not delete account."
      );

      setSaving(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem(
      "skillmateUser"
    );

    if (onLogout) {
      onLogout();
    }
  };

  // ==========================================
  // DASHBOARD HOME
  // ==========================================

  const renderDashboard = () => {
    return (
      <div className="dashboard-content">

        <div className="welcome-section">

          <p className="dashboard-eyebrow">
            SKILLMATES DASHBOARD
          </p>

          <h1>
            Welcome back, {user?.name} 👋
          </h1>

          <p>
            Connect with people who share your
            interests, skills and passions.
          </p>

        </div>


        {/* STATS */}

        <div className="dashboard-stats">

          <div
            className="stat-card"
            onClick={() =>
              setActivePage("connections")
            }
          >
            <span>🤝</span>

            <div>
              <strong>
                Connections
              </strong>

              <small>
                Meet your SkillMates
              </small>
            </div>
          </div>


          <div
            className="stat-card"
            onClick={() =>
              setActivePage("map")
            }
          >
            <span>📍</span>

            <div>
              <strong>
                Explore Map
              </strong>

              <small>
                Find nearby SkillMates
              </small>
            </div>
          </div>


          <div
            className="stat-card"
            onClick={() =>
              setActivePage("ai-guide")
            }
          >
            <span>🤖</span>

            <div>
              <strong>
                AI Guide
              </strong>

              <small>
                Discover new possibilities
              </small>
            </div>
          </div>

        </div>


        {/* PROFILE CARD */}

        <div className="dashboard-main-card">

          <div>

            <span className="card-label">
              YOUR PROFILE
            </span>

            <h2>
              {user?.name}
            </h2>

            <p>
              {user?.bio ||
                "Tell other SkillMates about yourself."}
            </p>

            <button
              type="button"
              onClick={() =>
                setActivePage("profile")
              }
            >
              Edit My Profile →
            </button>

          </div>


          <div className="mini-avatar">

         {user?.profile_picture ? (
  <img
    src={`${API_URL}${user.profile_picture}`}
    alt={user.name}
  />
) : (
  <span>👤</span>
)}

          </div>

        </div>


        {/* MAP PREVIEW */}

        <div className="map-preview-card">

          <div>

            <span className="card-label">
              DISCOVER NEARBY
            </span>

            <h2>
              Find SkillMates around you 🗺️
            </h2>

            <p>
              Explore people nearby who share
              your interests.
            </p>

            <button
              type="button"
              onClick={() =>
                setActivePage("map")
              }
            >
              Open Map →
            </button>

          </div>


          <div className="map-preview">
            📍
          </div>

        </div>


        {/* QUICK ACTIONS */}

        <div className="quick-actions">

          <h2>
            Quick Actions
          </h2>

          <div className="quick-action-grid">

            <button
              type="button"
              onClick={() =>
                setActivePage("connections")
              }
            >
              <span>👥</span>
              <strong>
                Connections
              </strong>
              <small>
                View your connections
              </small>
            </button>


            <button
              type="button"
              onClick={() =>
                setActivePage("communities")
              }
            >
              <span>🌐</span>
              <strong>
                Communities
              </strong>
              <small>
                Join communities
              </small>
            </button>
             

            <button
              type="button"
              onClick={() =>
                setActivePage("activities")
              }
            >
              <span>🎯</span>
              <strong>
                Activities
              </strong>
              <small>
                Find activities
              </small>
            </button>


            <button
              type="button"
              onClick={() =>
                setActivePage("ai-guide")
              }
            >
              <span>🤖</span>
              <strong>
                AI Guide
              </strong>
              <small>
                Get personalized help
              </small>
            </button>

          </div>

        </div>

      </div>
    );
  };


  // ==========================================
  // MAP
  // ==========================================
// ==========================================
// MAP
// ==========================================
// ==========================================
// MAP
// ==========================================

// ==========================================
// GET + SAVE CURRENT GPS LOCATION
// ==========================================

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    setLocationError(
      "Geolocation is not supported by your browser."
    );
    return;
  }

  if (!user?.id) {
    console.log("User not loaded yet.");
    return;
  }

  setLocationLoading(true);
  setLocationError("");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      console.log("CURRENT GPS LOCATION:", {
        latitude,
        longitude,
      });

      // ------------------------------------------
      // SAVE CURRENT GPS LOCATION IN STATE
      // ------------------------------------------

      setUserLocation({
        latitude,
        longitude,
      });

      try {
        // ------------------------------------------
        // SAVE CURRENT GPS LOCATION TO DATABASE
        // ------------------------------------------

        const response = await fetch(
            `${API_URL}/api/users/${user.id}/location`,
          {
            method: "PUT",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              latitude,
              longitude,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to save location"
          );
        }

        console.log(
          "LOCATION SAVED TO DATABASE:",
          data.user.latitude,
          data.user.longitude
        );

        // ------------------------------------------
        // UPDATE USER STATE
        // ------------------------------------------

        setUser(data.user);

        // ------------------------------------------
        // UPDATE LOCAL STORAGE
        // ------------------------------------------

        const currentUser = JSON.parse(
          localStorage.getItem("skillmateUser")
        );

        localStorage.setItem(
          "skillmateUser",
          JSON.stringify({
            ...currentUser,
            ...data.user,
          })
        );

      } catch (error) {
        console.error(
          "SAVE LOCATION ERROR:",
          error
        );

        setLocationError(
          "Your location was detected but could not be saved."
        );
      } finally {
        setLocationLoading(false);
      }
    },

    (error) => {
      console.error(
        "Location error:",
        error
      );

      setLocationLoading(false);

      if (error.code === 1) {
        setLocationError(
          "Location permission was denied. Please allow location access."
        );
      } else if (error.code === 2) {
        setLocationError(
          "Your location could not be detected."
        );
      } else if (error.code === 3) {
        setLocationError(
          "Location request timed out."
        );
      } else {
        setLocationError(
          "Could not get your current location."
        );
      }
    },

    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    }
  );
};

const renderMap = () => {
  // ==========================================
  // USERS WITH VALID LOCATION
  // ==========================================

  const usersWithLocation = Array.isArray(mapUsers)
    ? mapUsers.filter((mapUser) => {
        const latitude = Number(mapUser?.latitude);
        const longitude = Number(mapUser?.longitude);

        return (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180
        );
      })
    : [];

  // ==========================================
  // CHECK CURRENT GPS LOCATION
  // ==========================================

  const hasGpsLocation =
    userLocation &&
    Number.isFinite(Number(userLocation.latitude)) &&
    Number.isFinite(Number(userLocation.longitude));

  // ==========================================
  // CHECK SAVED DATABASE LOCATION
  // ==========================================

  const hasUserLocation =
    user &&
    Number.isFinite(Number(user.latitude)) &&
    Number.isFinite(Number(user.longitude));

  // ==========================================
  // MAP CENTER
  // ==========================================

  let mapCenter = [23.3441, 85.3096];

  if (hasGpsLocation) {
    mapCenter = [
      Number(userLocation.latitude),
      Number(userLocation.longitude),
    ];
  } else if (hasUserLocation) {
    mapCenter = [
      Number(user.latitude),
      Number(user.longitude),
    ];
  } else if (usersWithLocation.length > 0) {
    mapCenter = [
      Number(usersWithLocation[0].latitude),
      Number(usersWithLocation[0].longitude),
    ];
  }

  console.log("=================================");
  console.log("MAP CENTER:", mapCenter);
  console.log("GPS LOCATION:", userLocation);
  console.log("USER LOCATION:", {
    latitude: user?.latitude,
    longitude: user?.longitude,
  });
  console.log("MAP USERS:", usersWithLocation);
  console.log("=================================");

  return (
    <div className="dashboard-content">

      {/* =====================================
          PAGE HEADING
      ===================================== */}

      <div className="page-heading">

        <p className="dashboard-eyebrow">
          EXPLORE
        </p>

        <h1>
          SkillMates Map 🗺️
        </h1>

        <p>
          Find people near you who share
          your interests.
        </p>

      </div>


      {/* =====================================
          MAP
      ===================================== */}

      <div className="map-container">

        {mapLoading ? (

          <div className="map-loading">

            <span>
              📍
            </span>

            Finding SkillMates near you...

          </div>

        ) : (

          <MapContainer
            center={mapCenter}
            zoom={12}
            scrollWheelZoom={true}
            className="real-skillmates-map"
          >

            {/* =================================
                RECENTER MAP
            ================================= */}

            {hasGpsLocation && (
              <RecenterMap
                location={{
                  latitude: Number(
                    userLocation.latitude
                  ),
                  longitude: Number(
                    userLocation.longitude
                  ),
                }}
              />
            )}


            {/* =================================
                OPEN STREET MAP
            ================================= */}

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            {/* =================================
                OTHER SKILLMATES
            ================================= */}

            {usersWithLocation.map(
              (mapUser) => {

                // Don't show yourself
                if (
                  Number(mapUser.id) ===
                  Number(user?.id)
                ) {
                  return null;
                }

                const latitude =
                  Number(mapUser.latitude);

                const longitude =
                  Number(mapUser.longitude);

                return (
                  <Marker
                    key={mapUser.id}
                    position={[
                      latitude,
                      longitude,
                    ]}
                  >

                    <Popup>

                      <div className="map-user-popup">

                        {/* PROFILE IMAGE */}

                        {mapUser.profile_picture ? (

                          <img
                            src={`${API_URL}${mapUser.profile_picture}`}
                            alt={mapUser.name}
                            className="map-popup-avatar"
                          />

                        ) : (

                          <div className="map-popup-avatar-placeholder">
                            👤
                          </div>

                        )}


                        {/* NAME */}

                        <h3>
                          {mapUser.name}
                        </h3>


                        {/* BIO */}

                        <p>
                          {mapUser.bio ||
                            "No bio yet."}
                        </p>


                        {/* LOCATION */}

                        {mapUser.location && (

                          <small>
                            📍 {mapUser.location}
                          </small>

                        )}


                        {/* SKILLS */}

                        {Array.isArray(
                          mapUser.skills
                        ) &&
                          mapUser.skills.length > 0 && (

                            <div className="map-popup-skills">

                              {mapUser.skills
                                .slice(0, 3)
                                .map(
                                  (
                                    skill,
                                    index
                                  ) => (

                                    <span
                                      key={index}
                                    >
                                      {skill}
                                    </span>

                                  )
                                )}

                            </div>

                          )}

                      </div>

                    </Popup>

                  </Marker>
                );
              }
            )}


            {/* =================================
                YOUR LOCATION
            ================================= */}

            {hasGpsLocation && (

              <Marker
                position={[
                  Number(
                    userLocation.latitude
                  ),
                  Number(
                    userLocation.longitude
                  ),
                ]}
              >

                <Popup>

                  <div className="map-user-popup">

                    <div className="map-popup-avatar-placeholder">
                      📍
                    </div>

                    <h3>
                      You are here
                    </h3>

                    <p>
                      {user?.name}
                    </p>

                    {user?.location && (

                      <small>
                        📍 {user.location}
                      </small>

                    )}

                  </div>

                </Popup>

              </Marker>

            )}

          </MapContainer>

        )}

      </div>


      {/* =====================================
          MAP INFORMATION
      ===================================== */}

      <div className="map-info-card">

        <div>

          <strong>
            📍{" "}
            {user?.location ||
              user?.city ||
              "Your location"}
          </strong>

          <p>

            {usersWithLocation.length === 0

              ? "No SkillMates with a saved location yet."

              : `${usersWithLocation.length} SkillMate${
                  usersWithLocation.length === 1
                    ? ""
                    : "s"
                } found with location data.`}

          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            setActivePage("dashboard")
          }
        >
          ← Dashboard
        </button>

      </div>

    </div>
  );
};
  // ==========================================
  // PROFILE
  // ==========================================

  const renderProfile = () => {
    return (
      <div className="dashboard-content">

        <div className="page-heading">

          <p className="dashboard-eyebrow">
            ACCOUNT
          </p>

          <h1>
            My Profile
          </h1>

          <p>
            Manage your SkillMates profile.
          </p>

        </div>


        {message && (
          <div className="dashboard-success">
            {message}
          </div>
        )}


        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}


        <form
          className="profile-editor-card"
          onSubmit={handleSave}
        >

          {/* PROFILE PICTURE */}

          <div className="profile-picture-section">

            <div className="profile-picture-wrapper">

              {profilePreview ? (

                <img
                  src={profilePreview}
                  alt={user?.name}
                  className="profile-picture"
                />

              ) : (

                <div className="profile-picture-placeholder">
                  👤
                </div>

              )}

            </div>


            <div>

              <h3>
                Profile Picture
              </h3>

              <p>
                Add a picture so your SkillMates
                can recognize you.
              </p>

              <label className="upload-button">

                📷 Change Picture

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />

              </label>

            </div>

          </div>


          {/* NAME */}

          <div className="form-group">

            <label>
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
            />

          </div>


          {/* EMAIL */}

          <div className="form-group">

            <label>
              Email
            </label>

            <input
              type="email"
              value={user?.email || ""}
              disabled
            />

            <small>
              Email cannot be changed here.
            </small>

          </div>


          {/* BIO */}

          <div className="form-group">

            <label>
              Bio
            </label>

            <textarea
              value={bio}
              onChange={(event) =>
                setBio(event.target.value)
              }
              rows="5"
              placeholder="Tell us about yourself..."
            />

          </div>


          {/* LOCATION */}

          <div className="form-group">

            <label>
              Location
            </label>

            <input
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              placeholder="Your location"
            />

          </div>


          {/* SKILLS */}

          <div className="form-group">

            <label>
              Skills & Interests
            </label>

            <input
              type="text"
              value={skills}
              onChange={(event) =>
                setSkills(event.target.value)
              }
              placeholder="React, Guitar, Photography"
            />

            <small>
              Separate skills with commas.
            </small>

          </div>


          {/* LEARNING */}

          <div className="form-group">

            <label>
              I Want To Learn
            </label>

            <input
              type="text"
              value={learning}
              onChange={(event) =>
                setLearning(event.target.value)
              }
              placeholder="UI/UX, Cooking, Music"
            />

            <small>
              Separate interests with commas.
            </small>

          </div>


          {/* SAVE */}

          <button
            type="submit"
            className="save-profile-button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </form>


        {/* DELETE ACCOUNT */}

        <div className="danger-zone">

          <div>

            <span>
              DANGER ZONE
            </span>

            <h2>
              Delete Account
            </h2>

            <p>
              Permanently remove your SkillMates
              account and profile.
            </p>

          </div>


          {!showDeleteConfirm ? (

            <button
              type="button"
              className="delete-account-button"
              onClick={() =>
                setShowDeleteConfirm(true)
              }
            >
              Delete Account
            </button>

          ) : (

            <div className="delete-confirmation">

              <strong>
                Delete your account?
              </strong>

              <p>
                This action cannot be undone.
              </p>

              <div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDeleteConfirm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="confirm-delete-button"
                  onClick={handleDeleteAccount}
                  disabled={saving}
                >
                  {saving
                    ? "Deleting..."
                    : "Yes, Delete"}
                </button>

              </div>

            </div>

          )}

        </div>

      </div>
    );
  };


  // ==========================================
  // CONNECTIONS
  // ==========================================

  const renderConnections = () => {
    return (
      <div className="dashboard-content">

        <div className="page-heading">

          <p className="dashboard-eyebrow">
            SOCIAL
          </p>

          <h1>
            Your Connections 👥
          </h1>

          <p>
            Manage the people you connect with
            through SkillMates.
          </p>

        </div>


        <div className="coming-soon-card">

          <span>
            👥
          </span>

          <h2>
            Connections
          </h2>

          <p>
            Your SkillMates connections will
            appear here.
          </p>

        </div>

      </div>
    );
  };


  // ==========================================
  // COMMUNITIES
  // ==========================================

  const renderCommunities = () => {
    return (
      <div className="dashboard-content">

        <div className="page-heading">

          <p className="dashboard-eyebrow">
            COMMUNITY
          </p>

          <h1>
            Communities 🌐
          </h1>

          <p>
            Discover communities built around
            your interests.
          </p>

        </div>


        <div className="coming-soon-card">

          <span>
            🌐
          </span>

          <h2>
            Find Your Community
          </h2>

          <p>
            Communities will be available here.
          </p>

        </div>

      </div>
    );
  };
// ==========================================
// MESSAGES
// ==========================================

const renderMessages = () => {

  // ========================================
  // CHAT OPEN
  // ========================================

  if (selectedChatUser) {
    return (
      <div className="dashboard-content">

        <div className="page-heading">

          <p className="dashboard-eyebrow">
            MESSAGES
          </p>

          <h1>
            Chat with {selectedChatUser.name} 💬
          </h1>

          <p>
            Send messages and connect with your
            SkillMate.
          </p>

        </div>

        <div className="dashboard-chat-wrapper">

          <Chat
            user={selectedChatUser}
            onClose={() => {
              setSelectedChatUser(null);
            }}
          />

        </div>

      </div>
    );
  }


  // ========================================
  // MESSAGE LIST
  // ========================================

  return (
    <div className="dashboard-content">

      <div className="page-heading">

        <p className="dashboard-eyebrow">
          SOCIAL
        </p>

        <h1>
          Messages 💬
        </h1>

        <p>
          Chat with your SkillMates and build
          meaningful connections.
        </p>

      </div>


      {/* ERROR */}

      {messagesError && (
        <div className="dashboard-error">
          {messagesError}
        </div>
      )}


      {/* LOADING */}

      {messagesLoading ? (

        <div className="messages-loading-card">

          <span>
            💬
          </span>

          <h2>
            Loading your SkillMates...
          </h2>

          <p>
            Finding people you can chat with.
          </p>

        </div>

      ) : messageUsers.length === 0 ? (

        /* NO USERS */

        <div className="coming-soon-card">

          <span>
            💬
          </span>

          <h2>
            No SkillMates Yet
          </h2>

          <p>
            Discover people with similar
            skills and interests to start
            chatting.
          </p>

          <button
            type="button"
            onClick={() =>
              setActivePage("connections")
            }
          >
            Find SkillMates →
          </button>

        </div>

      ) : (

        /* USERS */

        <div className="messages-page">

          <div className="messages-list-header">

            <div>
              <span className="card-label">
                YOUR SKILLMATES
              </span>

              <h2>
                Start a Conversation
              </h2>
            </div>

            <span className="messages-count">
              {messageUsers.length}
            </span>

          </div>


          <div className="messages-user-list">

            {messageUsers.map(
              (messageUser) => (

                <button
                  type="button"
                  key={messageUser.id}
                  className="message-user-card"
                  onClick={() => {
                    setSelectedChatUser(
                      messageUser
                    );
                  }}
                >

                  {/* AVATAR */}

                  <div className="message-user-avatar">

                    {messageUser.profile_picture ? (

                      <img
                        src={`${API_URL}${messageUser.profile_picture}`}
                        alt={messageUser.name}
                      />

                    ) : (

                      <span>
                        👤
                      </span>

                    )}

                  </div>


                  {/* USER INFO */}

                  <div className="message-user-info">

                    <h3>
                      {messageUser.name}
                    </h3>

                    <p>
                      {messageUser.bio ||
                        "SkillMate on SkillMates"}
                    </p>

                    {Array.isArray(
                      messageUser.skills
                    ) &&
                      messageUser.skills.length > 0 && (

                        <div className="message-user-skills">

                          {messageUser.skills
                            .slice(0, 3)
                            .map(
                              (
                                skill,
                                index
                              ) => (

                                <span
                                  key={index}
                                >
                                  {skill}
                                </span>

                              )
                            )}

                        </div>

                      )}

                  </div>


                  {/* CHAT BUTTON */}

                  <div className="message-user-arrow">
                    →
                  </div>

                </button>

              )
            )}

          </div>

        </div>

      )}

    </div>
  );
};

  // =        =========================================
  // ACTIVITIES
  // ==========================================
const renderActivities = () => {
  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <p className="dashboard-eyebrow">DISCOVER</p>
        <h1>Activities 🎯</h1>
        <p>Find activities and events related to your interests.</p>
      </div>

      {!selectedActivity ? (
        <div className="activities-launcher">
          {/* your orbit launcher here */}

          <button
            type="button"
            className="orbit-activity orbit-chaos"
            onClick={() => setSelectedActivity("chaos")}
          >
            <div className="orbit-activity-icon">🤯</div>
            <div className="orbit-activity-info">
              <strong>Chaos Mode</strong>
              <small>Enter the chaos</small>
            </div>
          </button>

          <button
            type="button"
            className="orbit-activity orbit-color"
            onClick={() => setSelectedActivity("color")}
          >
            <div className="orbit-activity-icon">🌈</div>
            <div className="orbit-activity-info">
              <strong>Color Hunt</strong>
              <small>Find this color</small>
            </div>
          </button>
        </div>
      ) : (
        <ActivityWindow
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
};

  // ==========================================
  // AI GUIDE
  // ==========================================

  const renderAIGuide = () => {
    return (
      <div className="dashboard-content">

        <div className="page-heading">

          <p className="dashboard-eyebrow">
            ARTIFICIAL INTELLIGENCE
          </p>

          <h1>
            AI Guide 🤖
          </h1>

          <p>
            Get personalized suggestions based
            on your skills and interests.
          </p>

        </div>


        <div className="coming-soon-card ai-guide-card">

          <span>
            🤖
          </span>

          <h2>
            Your Personal AI Guide
          </h2>

          <p>
            Personalized SkillMates recommendations
            will appear here.
          </p>

        </div>

      </div>
    );
  };


  // ==========================================
  // SETTINGS
  // ==========================================

  const renderSettings = () => {
    return (
      <div className="dashboard-content">

        <div className="page-heading">

          <p className="dashboard-eyebrow">
            ACCOUNT
          </p>

          <h1>
            Settings ⚙️
          </h1>

          <p>
            Manage your SkillMates account settings.
          </p>

        </div>


        <div className="settings-card">

          <div className="settings-row">

            <div>

              <h3>
                Account
              </h3>

              <p>
                Manage your profile information.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setActivePage("profile")
              }
            >
              Edit Profile
            </button>

          </div>


          <div className="settings-row">

            <div>

              <h3>
                Logout
              </h3>

              <p>
                Sign out of your SkillMates account.
              </p>

            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="settings-logout"
            >
              Logout
            </button>

          </div>


          <div className="settings-row danger-setting">

            <div>

              <h3>
                Delete Account
              </h3>

              <p>
                Permanently delete your SkillMates
                account.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setActivePage("profile")
              }
              className="settings-delete"
            >
              Delete
            </button>

          </div>

        </div>

      </div>
    );
  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading your dashboard...
      </div>
    );
  }


  // ==========================================
  // MAIN DASHBOARD
  // ==========================================

  return (
    <div className="user-dashboard">

      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside className="dashboard-sidebar">

        {/* LOGO */}

        <div className="dashboard-logo">

          <span>
            ✦
          </span>

          SkillMates

        </div>


        {/* NAVIGATION */}

        <nav className="dashboard-nav">

          {/* DASHBOARD */}

          <button
            type="button"
            className={
              activePage === "dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("dashboard")
            }
          >
            <span>
              🏠
            </span>

            <span>
              Dashboard
            </span>

          </button>


          {/* MAP */}

          <button
            type="button"
            className={
              activePage === "map"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("map")
            }
          >
            <span>
              🗺️
            </span>

            <span>
              Explore Map
            </span>

          </button>
              

              

          {/* CONNECTIONS */}

          <button
            type="button"
            className={
              activePage === "connections"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("connections")
            }
          >
            <span>
              👥
            </span>

            <span>
              Connections
            </span>

          </button>
{/* INTERESTS */}
<button
  type="button"
  className={activePage === "interests" ? "active" : ""}
  onClick={() => setActivePage("interests")}
>
  <span>💡</span>
  <span>Interests</span>
</button>

          {/* COMMUNITIES */}

          <button
            type="button"
            className={
              activePage === "communities"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("communities")
            }
          >
            <span>
              🌐
            </span>

            <span>
              Communities
            </span>

          </button>



{/* MESSAGES */}

<button
  type="button"
  className={
    activePage === "messages"
      ? "active"
      : ""
  }
  onClick={() =>
    setActivePage("messages")
  }
>
  <span>
    💬
  </span>

  <span>
    Messages
  </span>

</button>

          {/* ACTIVITIES */}

          <button
            type="button"
            className={
              activePage === "activities"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("activities")
            }
          >
            <span>
              🎯
            </span>

            <span>
              Activities
            </span>

          </button>


          {/* AI GUIDE */}

          <button
            type="button"
            className={
              activePage === "ai-guide"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("ai-guide")
            }
          >
            <span>
              🤖
            </span>

            <span>
              AI Guide
            </span>

          </button>


          {/* DIVIDER */}

          <div className="dashboard-nav-divider"></div>


          {/* PROFILE */}

          <button
            type="button"
            className={
              activePage === "profile"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("profile")
            }
          >
            <span>
              👤
            </span>

            <span>
              My Profile
            </span>

          </button>


          {/* SETTINGS */}

          <button
            type="button"
            className={
              activePage === "settings"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("settings")
            }
          >
            <span>
              ⚙️
            </span>

            <span>
              Settings
            </span>

          </button>

        </nav>


        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          {/* BACK */}

          <button
            type="button"
            className="back-to-app-button"
            onClick={onBack}
          >
            <span>
              ←
            </span>

            Back to SkillMates
          </button>


          {/* LOGOUT */}

          <button
            type="button"
            className="sidebar-logout-button"
            onClick={handleLogout}
          >
            <span>
              🚪
            </span>

            Logout
          </button>

        </div>

      </aside>


      {/* ======================================
          MAIN
      ====================================== */}

      <main className="dashboard-main">

        {/* TOP BAR */}

        <header className="dashboard-topbar">

          <div className="topbar-page-name">

            <span>
              {activePage === "dashboard" &&
                "Dashboard"}

              {activePage === "map" &&
                "Explore Map"}

              {activePage === "connections" &&
                "Connections"}

               {activePage === "interests" && "Interests"}

              {activePage === "communities" &&
                "Communities"}

                {activePage === "messages" &&
  "Messages"}

              {activePage === "activities" &&
                "Activities"}

              {activePage === "ai-guide" &&
                "AI Guide"}

              {activePage === "profile" &&
                "My Profile"}

              {activePage === "settings" &&
                "Settings"}
            </span>

          </div>


          {/* USER */}

          <div className="dashboard-user">

        {user?.profile_picture ? (
  <img
    src={`${API_URL}${user.profile_picture}`}
    alt={user.name}
  />
) : (
  <span>👤</span>
)}
            <strong>
              {user?.name}
            </strong>

          </div>

        </header>


        {/* ==================================
            PAGE CONTENT
        ================================== */}

        {activePage === "dashboard" &&
          renderDashboard()}

        {activePage === "map" &&
          renderMap()}

        {activePage === "connections" &&
          renderConnections()}

          {activePage === "interests" &&
  <Interests user={user} 
     setUser={setUser}
  />}

        {activePage === "communities" &&
          renderCommunities()}
 

{activePage === "messages" &&
  renderMessages()}

        {activePage === "activities" &&
          renderActivities()}

        {activePage === "ai-guide" &&
          renderAIGuide()}

        {activePage === "profile" &&
          renderProfile()}

        {activePage === "settings" &&
          renderSettings()}

      </main>

    </div>
  );
}

export default UserDashboard;