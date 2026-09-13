import { useEffect, useRef, useState } from "react";
import Particles from "./Particles";
import "./ColorHunt.css";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const COLORS = [
  { name: "RED", value: "#ff3b30" },
  { name: "BLUE", value: "#007aff" },
  { name: "GREEN", value: "#34c759" },
  { name: "YELLOW", value: "#ffcc00" },
  { name: "ORANGE", value: "#ff9500" },
  { name: "PURPLE", value: "#af52de" },
  { name: "PINK", value: "#ff2d55" },
];

function ColorHunt() {
  const [screen, setScreen] = useState("home");

  // =========================
  // SOLO
  // =========================

  const [photos, setPhotos] = useState([]);
  const [targetColor, setTargetColor] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // =========================
  // CAMERA
  // =========================

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  const videoRef = useRef(null);

  // Prevent multiple finish mutations
  const finishTriggeredRef = useRef(false);

  // =========================
  // COLOR HUNT MULTIPLAYER
  // =========================

  const createColorRoom = useMutation(
    api.colorRooms.createRoom
  );

  const joinColorRoom = useMutation(
    api.colorRooms.joinRoom
  );

  const startColorGame = useMutation(
    api.colorRooms.startGame
  );

  const addColorPhoto = useMutation(
    api.colorRooms.addPhoto
  );

  const generateColorUploadUrl = useMutation(
    api.colorRooms.generateUploadUrl
  );

  const deleteColorPhoto = useMutation(
    api.colorRooms.deletePhoto
  );

  const finishColorGameMutation = useMutation(
    api.colorRooms.finishGame
  );

  const [colorRoom, setColorRoom] = useState(null);
  const [colorPlayerRole, setColorPlayerRole] =
    useState(null);

  const [joinCode, setJoinCode] = useState("");
  const [joinScreen, setJoinScreen] = useState(false);
  const [roomError, setRoomError] = useState("");

  const [multiplayerTimeLeft, setMultiplayerTimeLeft] =
    useState(60);

  const loggedInUser = JSON.parse(
    localStorage.getItem("skillmateUser") || "null"
  );

  const playerName =
    loggedInUser?.name ||
    loggedInUser?.username ||
    "Player";

  // =========================
  // REAL-TIME ROOM DATA
  // =========================

  const roomData = useQuery(
    api.colorRooms.getRoom,
    colorRoom?.roomId
      ? {
          roomId: colorRoom.roomId,
        }
      : "skip"
  );

  // =========================
  // MULTIPLAYER PHOTO UPLOAD
  // =========================

  const uploadMultiplayerPhoto = async (file) => {
    if (!file) {
      throw new Error("No photo selected.");
    }

    if (!colorRoom?.roomId || !colorPlayerRole) {
      throw new Error(
        "Color Hunt room is not ready."
      );
    }

    // Get Convex temporary upload URL
    const uploadUrl =
      await generateColorUploadUrl();

    // Upload actual file
    const uploadResponse = await fetch(
      uploadUrl,
      {
        method: "POST",
        headers: {
          "Content-Type":
            file.type || "image/jpeg",
        },
        body: file,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error(
        "Failed to upload photo."
      );
    }

    const uploadResult =
      await uploadResponse.json();

    const storageId =
      uploadResult.storageId;

    if (!storageId) {
      throw new Error(
        "Convex did not return a storage ID."
      );
    }

    // Save storage ID in room
    await addColorPhoto({
      roomId: colorRoom.roomId,
      player: colorPlayerRole,
      storageId,
    });
  };

  // =========================
  // UPDATE TARGET COLOR
  // =========================

  useEffect(() => {
    if (!roomData) return;

    const color = COLORS.find(
      (item) =>
        item.name === roomData.targetColor
    );

    if (color) {
      setTargetColor(color);
    }
  }, [roomData?.targetColor]);

  // =========================
  // CHANGE SCREEN FROM ROOM STATUS
  // =========================

  useEffect(() => {
    if (!roomData) return;

    if (roomData.status === "playing") {
      setScreen("multiplayer-game");
    }

    if (roomData.status === "finished") {
      setScreen("multiplayer-result");
    }
  }, [roomData?.status]);

  // =========================
  // SHARED MULTIPLAYER TIMER
  // =========================

  useEffect(() => {
    if (
      roomData?.status !== "playing" ||
      !roomData?.endsAt ||
      !colorRoom?.roomId
    ) {
      return;
    }

    finishTriggeredRef.current = false;

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (roomData.endsAt - Date.now()) /
            1000
        )
      );

      setMultiplayerTimeLeft(
        remaining
      );

      if (
        remaining <= 0 &&
        !finishTriggeredRef.current
      ) {
        finishTriggeredRef.current = true;

        finishColorGameMutation({
          roomId: colorRoom.roomId,
        }).catch((error) => {
          console.error(
            "Failed to finish Color Hunt:",
            error
          );
        });
      }
    };

    updateTimer();

    const timer = setInterval(
      updateTimer,
      250
    );

    return () => {
      clearInterval(timer);
    };
  }, [
    roomData?.status,
    roomData?.endsAt,
    colorRoom?.roomId,
    finishColorGameMutation,
  ]);

  // =========================
  // START SOLO GAME
  // =========================

  const startSoloGame = () => {
    const randomColor =
      COLORS[
        Math.floor(
          Math.random() *
            COLORS.length
        )
      ];

    setTargetColor(randomColor);
    setPhotos([]);
    setScore(0);
    setTimeLeft(60);
    setSelectedPhoto(null);
    setScreen("solo");
  };

  // =========================
  // SOLO TIMER
  // =========================

  useEffect(() => {
    if (screen !== "solo") return;

    if (timeLeft <= 0) {
      setScreen("result");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(
        (previous) =>
          previous - 1
      );
    }, 1000);

    return () =>
      clearInterval(timer);
  }, [screen, timeLeft]);

  // =========================
  // SOLO PHOTO UPLOAD
  // =========================

  const handlePhotoUpload = (
    event
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) return;

    const newPhotos =
      files.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        url: URL.createObjectURL(
          file
        ),
      }));

    setPhotos((previous) => [
      ...previous,
      ...newPhotos,
    ]);

    setScore(
      (previous) =>
        previous +
        files.length * 10
    );

    event.target.value = "";
  };

  // =========================
  // OPEN CAMERA
  // =========================

  const openCamera = async () => {
    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getUserMedia
      ) {
        alert(
          "Camera is not supported by this browser."
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              facingMode: {
                ideal: "environment",
              },
            },
            audio: false,
          }
        );

      setCameraStream(stream);
      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          videoRef.current
            .play()
            .catch((error) => {
              console.error(
                "Video play error:",
                error
              );
            });
        }
      }, 100);
    } catch (error) {
      console.error(
        "Camera permission error:",
        error
      );

      if (
        error.name ===
        "NotAllowedError"
      ) {
        alert(
          "Camera permission was denied. Please allow camera access in your browser settings."
        );
      } else if (
        error.name ===
        "NotFoundError"
      ) {
        alert(
          "No camera was found on this device."
        );
      } else {
        alert(
          "Unable to open the camera. Please check your camera permission."
        );
      }
    }
  };

  // =========================
  // SOLO CAMERA CAPTURE
  // =========================

  const capturePhoto = () => {
    const video =
      videoRef.current;

    if (!video) return;

    if (
      !video.videoWidth ||
      !video.videoHeight
    ) {
      alert(
        "Camera is still loading. Please try again."
      );
      return;
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File(
          [blob],
          `color-hunt-${Date.now()}.jpg`,
          {
            type: "image/jpeg",
          }
        );

        const photo = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          url: URL.createObjectURL(
            file
          ),
        };

        setPhotos((previous) => [
          ...previous,
          photo,
        ]);

        setScore(
          (previous) =>
            previous + 10
        );

        closeCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  // =========================
  // CLOSE CAMERA
  // =========================

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream
        .getTracks()
        .forEach((track) => {
          track.stop();
        });
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    setCameraStream(null);
    setCameraOpen(false);
  };

  // =========================
  // STOP CAMERA WHEN LEAVING
  // =========================

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }
    };
  }, [cameraStream]);

  // =========================
  // SOLO FINISH
  // =========================

  const finishGame = () => {
    closeCamera();
    setSelectedPhoto(null);
    setScreen("result");
  };

  // =========================
  // GO HOME
  // =========================

  const goHome = () => {
    closeCamera();

    setScreen("home");

    setPhotos([]);
    setTargetColor(null);
    setTimeLeft(60);
    setScore(0);
    setSelectedPhoto(null);

    setColorRoom(null);
    setColorPlayerRole(null);

    setJoinCode("");
    setJoinScreen(false);
    setRoomError("");

    setMultiplayerTimeLeft(60);

    finishTriggeredRef.current =
      false;
  };

  // =========================
  // FINISH MULTIPLAYER GAME
  // =========================

  const finishColorGame = async () => {
    if (!colorRoom?.roomId) return;

    try {
      await finishColorGameMutation({
        roomId: colorRoom.roomId,
      });
    } catch (error) {
      console.error(
        "Failed to finish Color Hunt:",
        error
      );
    }
  };

  // =========================
  // START MULTIPLAYER GAME
  // =========================

  const handleStartColorGame =
    async () => {
      if (!colorRoom?.roomId) return;

      try {
        setRoomError("");

        await startColorGame({
          roomId:
            colorRoom.roomId,
        });

        console.log(
          "Color Hunt started!"
        );
      } catch (error) {
        console.error(
          "Failed to start Color Hunt:",
          error
        );

        setRoomError(
          error.message ||
            "Failed to start game"
        );
      }
    };

  // =========================
  // CREATE COLOR ROOM
  // =========================

  const handleCreateRoom =
    async () => {
      try {
        setRoomError("");

        const result =
          await createColorRoom({
            playerName,
          });

        setColorRoom(result);
        setColorPlayerRole("A");

        setPhotos([]);
        setScore(0);
        setMultiplayerTimeLeft(60);

        setJoinScreen(false);

        console.log(
          "Color Hunt room created:",
          result
        );
      } catch (error) {
        console.error(
          "Failed to create Color Hunt room:",
          error
        );

        setRoomError(
          error.message ||
            "Failed to create room"
        );
      }
    };

  // =========================
  // JOIN COLOR ROOM
  // =========================

  const handleJoinRoom =
    async () => {
      const code =
        joinCode.trim();

      if (!code) {
        setRoomError(
          "Please enter a room code."
        );
        return;
      }

      try {
        setRoomError("");

        const result =
          await joinColorRoom({
            roomCode: code,
            playerName,
          });

        setColorRoom(result);
        setColorPlayerRole("B");

        setPhotos([]);
        setScore(0);
        setMultiplayerTimeLeft(60);

        setJoinScreen(false);

        console.log(
          "Joined Color Hunt room:",
          result
        );
      } catch (error) {
        console.error(
          "Failed to join Color Hunt room:",
          error
        );

        setRoomError(
          error.message ||
            "Failed to join room"
        );
      }
    };

  // =========================
  // HOME
  // =========================

  if (screen === "home") {
    return (
      <div className="color-content">
        <Particles />

        <div className="color-hunt-card">
          <div className="color-hunt-icon">
            🌈
          </div>

          <h2>Color Hunt</h2>

          <p>
            Find the target color around
            you before your SkillMate does.
          </p>

          <div className="color-mode-buttons">
            <button
              type="button"
              className="color-solo-btn"
              onClick={startSoloGame}
            >
              🎯 Solo
            </button>

            <button
              type="button"
              className="color-multiplayer-btn"
              onClick={() =>
                setScreen("multiplayer")
              }
            >
              👥 Multiplayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // SOLO GAME
  // =========================

  if (screen === "solo") {
    return (
      <div className="color-content">
        <Particles />

        <div className="color-hunt-card color-solo-game">
          <div className="color-game-top">
            <div className="color-timer">
              ⏱ {timeLeft}s
            </div>

            <div className="color-score">
              ⭐ {score}
            </div>
          </div>

          <p className="color-find-label">
            FIND
          </p>

          <div className="color-target">
            <div
              className="color-target-circle"
              style={{
                backgroundColor:
                  targetColor?.value,
              }}
            />

            <h2>
              {targetColor?.name}
            </h2>
          </div>

          <p>
            Find objects with this color
            and take or upload as many
            photos as possible!
          </p>

          <div className="color-photo-actions">
            <button
              type="button"
              className="color-photo-btn"
              onClick={openCamera}
            >
              📷 Camera
            </button>

            <label className="color-photo-btn">
              🖼️ Upload Photos

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={
                  handlePhotoUpload
                }
                hidden
              />
            </label>
          </div>

          {cameraOpen && (
            <div className="color-camera">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="color-camera-video"
              />

              <div className="color-camera-buttons">
                <button
                  type="button"
                  className="color-solo-btn"
                  onClick={
                    capturePhoto
                  }
                >
                  📸 Capture
                </button>

                <button
                  type="button"
                  className="color-back-btn"
                  onClick={
                    closeCamera
                  }
                >
                  ✕ Close
                </button>
              </div>
            </div>
          )}

          {photos.length > 0 && (
            <div className="color-photo-section">
              <h3>
                Your Photos (
                {photos.length})
              </h3>

              <div className="color-photo-grid">
                {photos.map(
                  (photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      className="color-photo-click"
                      onClick={() =>
                        setSelectedPhoto(
                          photo
                        )
                      }
                    >
                      <img
                        src={photo.url}
                        alt="Color Hunt"
                        className="color-photo-thumb"
                      />
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <div className="color-game-buttons">
            <button
              type="button"
              className="color-finish-btn"
              onClick={finishGame}
            >
              Finish Hunt
            </button>

            <button
              type="button"
              className="color-back-btn"
              onClick={goHome}
            >
              ← Back
            </button>
          </div>
        </div>

        {selectedPhoto && (
          <div
            className="color-photo-modal"
            onClick={() =>
              setSelectedPhoto(null)
            }
          >
            <div
              className="color-photo-modal-content"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                className="color-photo-close"
                onClick={() =>
                  setSelectedPhoto(null)
                }
              >
                ✕
              </button>

              <img
                src={selectedPhoto.url}
                alt="Color Hunt preview"
                className="color-photo-large"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================
  // MULTIPLAYER ROOM
  // =========================

  if (screen === "multiplayer") {
    return (
      <div className="color-content">
        <Particles />

        <div className="color-hunt-card">
          <div className="color-hunt-icon">
            👥
          </div>

          <h2>Multiplayer</h2>

          {!colorRoom &&
            !joinScreen && (
              <>
                <p>
                  Play Color Hunt against
                  your SkillMate.
                </p>

                <div className="color-room-buttons">
                  <button
                    type="button"
                    className="color-create-room-btn"
                    onClick={
                      handleCreateRoom
                    }
                  >
                    🏠 Create Room
                  </button>

                  <button
                    type="button"
                    className="color-join-room-btn"
                    onClick={() => {
                      setRoomError("");
                      setJoinCode("");
                      setJoinScreen(
                        true
                      );
                    }}
                  >
                    👥 Join Room
                  </button>
                </div>

                {roomError && (
                  <p className="color-room-error">
                    {roomError}
                  </p>
                )}

                <button
                  type="button"
                  className="color-back-btn"
                  onClick={goHome}
                >
                  ← Back
                </button>
              </>
            )}

          {/* JOIN ROOM */}

          {!colorRoom &&
            joinScreen && (
              <>
                <p>
                  Enter the room code
                  shared by your
                  SkillMate.
                </p>

                <div className="color-join-input">
                  <input
                    type="text"
                    placeholder="ROOM CODE"
                    value={joinCode}
                    onChange={(
                      event
                    ) =>
                      setJoinCode(
                        event.target.value
                          .toUpperCase()
                          .replace(
                            /[^A-Z0-9]/g,
                            ""
                          )
                      )
                    }
                    maxLength={6}
                  />
                </div>

                <div className="color-room-buttons">
                  <button
                    type="button"
                    className="color-join-room-btn"
                    onClick={
                      handleJoinRoom
                    }
                  >
                    👥 Join Room
                  </button>

                  <button
                    type="button"
                    className="color-back-btn"
                    onClick={() => {
                      setJoinScreen(
                        false
                      );
                      setJoinCode("");
                      setRoomError("");
                    }}
                  >
                    ← Back
                  </button>
                </div>

                {roomError && (
                  <p className="color-room-error">
                    {roomError}
                  </p>
                )}
              </>
            )}

          {/* ROOM */}

          {colorRoom && (
            <>
              <div className="color-room-created">
                <p>
                  {roomData?.status ===
                  "ready"
                    ? "SkillMate Joined! 🎉"
                    : "Room Created 🎉"}
                </p>

                <p>
                  Room Code
                </p>

                <h2>
                  {colorRoom.roomCode}
                </h2>

                <button
                  type="button"
                  className="color-copy-code-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      colorRoom.roomCode
                    );

                    alert(
                      "Room code copied!"
                    );
                  }}
                >
                  📋 Copy Code
                </button>

                {/* PLAYER A WAITING */}

                {colorPlayerRole ===
                  "A" &&
                  roomData?.status ===
                    "waiting" && (
                    <p>
                      ⏳ Waiting for
                      Player B to
                      join...
                    </p>
                  )}

                {/* PLAYER A READY */}

                {colorPlayerRole ===
                  "A" &&
                  roomData?.status ===
                    "ready" && (
                    <>
                      <p>
                        🟢 Player B has
                        joined!
                      </p>

                      <p>
                        Player B:{" "}
                        <strong>
                          {
                            roomData?.playerB
                          }
                        </strong>
                      </p>
                    </>
                  )}

                {/* PLAYER B */}

                {colorPlayerRole ===
                  "B" &&
                  roomData?.status ===
                    "ready" && (
                    <>
                      <p>
                        🟢 You joined the
                        room!
                      </p>

                      <p>
                        Player A:{" "}
                        <strong>
                          {
                            roomData?.playerA
                          }
                        </strong>
                      </p>

                      <p>
                        ⏳ Waiting for
                        Player A to
                        start...
                      </p>
                    </>
                  )}

                {/* START */}

                {roomData?.status ===
                  "ready" &&
                  colorPlayerRole ===
                    "A" && (
                    <button
                      type="button"
                      className="color-solo-btn"
                      onClick={
                        handleStartColorGame
                      }
                    >
                      🎨 Start Hunt
                    </button>
                  )}

                {/* TARGET */}

                <div
                  className="color-room-target"
                  style={{
                    backgroundColor:
                      COLORS.find(
                        (color) =>
                          color.name ===
                          colorRoom.targetColor
                      )?.value ||
                      "#ccc",
                  }}
                >
                  {
                    colorRoom.targetColor
                  }
                </div>
              </div>

              <button
                type="button"
                className="color-back-btn"
                onClick={goHome}
              >
                ← Leave Room
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // MULTIPLAYER GAME
  // =========================

  if (
    screen === "multiplayer-game"
  ) {
    const myPhotos =
      colorPlayerRole === "A"
        ? roomData?.photosA || []
        : roomData?.photosB || [];

    const opponentPhotos =
      colorPlayerRole === "A"
        ? roomData?.photosB || []
        : roomData?.photosA || [];

    const myScore =
      colorPlayerRole === "A"
        ? roomData?.scoreA || 0
        : roomData?.scoreB || 0;

    const opponentScore =
      colorPlayerRole === "A"
        ? roomData?.scoreB || 0
        : roomData?.scoreA || 0;

    const myName =
      colorPlayerRole === "A"
        ? roomData?.playerA
        : roomData?.playerB;

    const opponentName =
      colorPlayerRole === "A"
        ? roomData?.playerB
        : roomData?.playerA;

    return (
      <div className="color-content">
        <Particles />

        <div className="color-hunt-card color-solo-game color-multiplayer-game">

          {/* TOP BAR */}

          <div className="color-game-top">
            <div className="color-timer">
              ⏱ {multiplayerTimeLeft}s
            </div>

            <div className="color-score">
              ⭐ {myScore}
            </div>
          </div>

                    {/* TARGET */}

          <p className="color-find-label">
            FIND
          </p>

          <div className="color-target">
            <div
              className="color-target-circle"
              style={{
                backgroundColor:
                  targetColor?.value,
              }}
            />

            <h2>
              {targetColor?.name}
            </h2>
          </div>

          <p>
            Find objects with this color!
            Take or upload as many photos as
            possible before time runs out.
          </p>

          {/* PLAYERS */}

          <div className="color-player-list">
            <div>
              👤 You —{" "}
              {myName || "Player"}
              {" • "}
              ⭐ {myScore}
            </div>

            <div>
              🎮 SkillMate —{" "}
              {opponentName || "Waiting..."}
              {" • "}
              ⭐ {opponentScore}
            </div>
          </div>

          {/* PHOTO ACTIONS */}

          <div className="color-photo-actions">
            <button
              type="button"
              className="color-photo-btn"
              onClick={openCamera}
              disabled={multiplayerTimeLeft <= 0}
            >
              📷 Camera
            </button>

            <label
              className="color-photo-btn"
              style={{
                opacity:
                  multiplayerTimeLeft <= 0
                    ? 0.5
                    : 1,
                pointerEvents:
                  multiplayerTimeLeft <= 0
                    ? "none"
                    : "auto",
              }}
            >
              🖼️ Upload Photos

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (event) => {
                  const files = Array.from(
                    event.target.files || []
                  );

                  if (!files.length) return;

                  for (const file of files) {
                    try {
                      await uploadMultiplayerPhoto(
                        file
                      );
                    } catch (error) {
                      console.error(
                        "Failed to upload multiplayer photo:",
                        error
                      );

                      alert(
                        error.message ||
                          "Failed to upload photo."
                      );
                    }
                  }

                  event.target.value = "";
                }}
                hidden
              />
            </label>
          </div>
                    {cameraOpen && (
            <div className="color-camera multiplayer-camera">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="color-camera-video"
              />

              <div className="color-camera-buttons">
                <button
                  type="button"
                  className="color-solo-btn"
                  onClick={() => {
                    const video = videoRef.current;

                    if (!video) return;

                    if (
                      !video.videoWidth ||
                      !video.videoHeight
                    ) {
                      alert(
                        "Camera is still loading. Please try again."
                      );
                      return;
                    }

                    const canvas =
                      document.createElement("canvas");

                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const context =
                      canvas.getContext("2d");

                    if (!context) return;

                    context.drawImage(
                      video,
                      0,
                      0,
                      canvas.width,
                      canvas.height
                    );

                    canvas.toBlob(
                      async (blob) => {
                        if (!blob) return;

                        const file = new File(
                          [blob],
                          `color-hunt-${Date.now()}.jpg`,
                          {
                            type: "image/jpeg",
                          }
                        );

                        try {
                          await uploadMultiplayerPhoto(file);
                        } catch (error) {
                          console.error(
                            "Failed to save camera photo:",
                            error
                          );

                          alert(
                            error.message ||
                              "Failed to upload camera photo."
                          );
                        }

                        closeCamera();
                      },
                      "image/jpeg",
                      0.9
                    );
                  }}
                  disabled={multiplayerTimeLeft <= 0}
                >
                  📸 Capture
                </button>

                <button
                  type="button"
                  className="color-back-btn"
                  onClick={closeCamera}
                >
                  ✕ Close
                </button>
              </div>
            </div>
          )}
                    {/* YOUR PHOTOS */}

          <div className="color-photo-section">
            <h3>
              Your Photos ({myPhotos.length})
            </h3>

            {myPhotos.length > 0 ? (
              <div className="color-photo-grid">
                {myPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="color-photo-item"
                  >
                    <button
                      type="button"
                      className="color-photo-click"
                      onClick={() =>
                        setSelectedPhoto(photo)
                      }
                    >
                      <img
                        src={photo.url}
                        alt="Your Color Hunt"
                        className="color-photo-thumb"
                      />
                    </button>

                    <button
                      type="button"
                      className="color-photo-delete"
                      onClick={async () => {
                        try {
                          await deleteColorPhoto({
                            roomId: colorRoom.roomId,
                            player: colorPlayerRole,
                            photoId: photo.id,
                          });
                        } catch (error) {
                          console.error(
                            "Failed to delete photo:",
                            error
                          );

                          alert(
                            error.message ||
                              "Failed to delete photo."
                          );
                        }
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="color-empty-photos">
                No photos yet. Start hunting!
              </p>
            )}
          </div>

          {/* SKILLMATE PHOTOS */}

          <div className="color-photo-section">
            <h3>
              SkillMate's Photos (
              {opponentPhotos.length})
            </h3>

            {opponentPhotos.length > 0 ? (
              <div className="color-photo-grid">
                {opponentPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    className="color-photo-click"
                    onClick={() =>
                      setSelectedPhoto(photo)
                    }
                  >
                    <img
                      src={photo.url}
                      alt="SkillMate Color Hunt"
                      className="color-photo-thumb"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="color-empty-photos">
                SkillMate has not uploaded a photo yet.
              </p>
            )}
          </div>

          {/* GAME BUTTONS */}

          <div className="color-game-buttons">
            <button
              type="button"
              className="color-finish-btn"
              onClick={finishColorGame}
            >
              Finish Hunt
            </button>

            <button
              type="button"
              className="color-back-btn"
              onClick={goHome}
            >
              ← Leave Game
            </button>
          </div>
        </div>

        {/* PHOTO MODAL */}

        {selectedPhoto && (
          <div
            className="color-photo-modal"
            onClick={() =>
              setSelectedPhoto(null)
            }
          >
            <div
              className="color-photo-modal-content"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                className="color-photo-close"
                onClick={() =>
                  setSelectedPhoto(null)
                }
              >
                ✕
              </button>

              <img
                src={selectedPhoto.url}
                alt="Color Hunt preview"
                className="color-photo-large"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================
  // MULTIPLAYER RESULT
  // =========================

  if (screen === "multiplayer-result") {
    const myPhotos =
      colorPlayerRole === "A"
        ? roomData?.photosA || []
        : roomData?.photosB || [];

    const opponentPhotos =
      colorPlayerRole === "A"
        ? roomData?.photosB || []
        : roomData?.photosA || [];

    const myScore =
      colorPlayerRole === "A"
        ? roomData?.scoreA || 0
        : roomData?.scoreB || 0;

    const opponentScore =
      colorPlayerRole === "A"
        ? roomData?.scoreB || 0
        : roomData?.scoreA || 0;

    const myName =
      colorPlayerRole === "A"
        ? roomData?.playerA
        : roomData?.playerB;

    const opponentName =
      colorPlayerRole === "A"
        ? roomData?.playerB
        : roomData?.playerA;

    const winner =
      myScore > opponentScore
        ? "You Win! 🎉"
        : myScore < opponentScore
        ? "SkillMate Wins! 🏆"
        : "It's a Tie! 🤝";

    return (
      <div className="color-content">
        <Particles />

        <div className="color-hunt-card color-result-card">
          <div className="color-hunt-icon">
            🏆
          </div>

          <h2>{winner}</h2>

          <p>
            Color Hunt has finished!
          </p>

          {/* FINAL SCORE */}

          <div className="color-final-scores">
            <div className="color-final-player">
              <h3>
                👤 {myName || "You"}
              </h3>

              <div className="color-final-score">
                ⭐ {myScore}
              </div>
            </div>

            <div className="color-final-vs">
              VS
            </div>

            <div className="color-final-player">
              <h3>
                🎮 {opponentName || "SkillMate"}
              </h3>

              <div className="color-final-score">
                ⭐ {opponentScore}
              </div>
            </div>
          </div>

          {/* YOUR PHOTOS */}

          <div className="color-photo-section">
            <h3>
              Your Photos ({myPhotos.length})
            </h3>

            {myPhotos.length > 0 ? (
              <div className="color-photo-grid">
                {myPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    className="color-photo-click"
                    onClick={() =>
                      setSelectedPhoto(photo)
                    }
                  >
                    <img
                      src={photo.url}
                      alt="Your Color Hunt"
                      className="color-photo-thumb"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="color-empty-photos">
                No photos uploaded.
              </p>
            )}
          </div>

          {/* SKILLMATE PHOTOS */}

          <div className="color-photo-section">
            <h3>
              SkillMate's Photos (
              {opponentPhotos.length})
            </h3>

            {opponentPhotos.length > 0 ? (
              <div className="color-photo-grid">
                {opponentPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    className="color-photo-click"
                    onClick={() =>
                      setSelectedPhoto(photo)
                    }
                  >
                    <img
                      src={photo.url}
                      alt="SkillMate Color Hunt"
                      className="color-photo-thumb"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="color-empty-photos">
                No photos uploaded.
              </p>
            )}
          </div>

          <div className="color-game-buttons">
            <button
              type="button"
              className="color-solo-btn"
              onClick={goHome}
            >
              🎨 Play Again
            </button>
          </div>
        </div>

        {/* PHOTO MODAL */}

        {selectedPhoto && (
          <div
            className="color-photo-modal"
            onClick={() =>
              setSelectedPhoto(null)
            }
          >
            <div
              className="color-photo-modal-content"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                className="color-photo-close"
                onClick={() =>
                  setSelectedPhoto(null)
                }
              >
                ✕
              </button>

              <img
                src={selectedPhoto.url}
                alt="Color Hunt preview"
                className="color-photo-large"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default ColorHunt;