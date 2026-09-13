import { useEffect, useRef, useState } from "react";
import "./Connections.css";
import backgroundImage from "../1.jpg";
const API_URL = import.meta.env.VITE_API_URL;
function Connections() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const carouselRef = useRef(null);
  const viewportRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);

  const dragRef = useRef({
    dragging: false,
    startX: 0,
  });

  const loggedInUser = JSON.parse(
    localStorage.getItem("skillmateUser")
  );

  /* =====================================================
     FETCH CONNECTIONS
     ===================================================== */

  const fetchRequests = async () => {
    if (!loggedInUser?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/connections/${loggedInUser.id}`
      );

      if (!response.ok) {
        throw new Error("Failed to load connections");
      }

      const data = await response.json();

      setRequests(data);
    } catch (error) {
      console.error(error);
      setMessage("Could not load connection requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  /* =====================================================
     UPDATE CONNECTION
     ===================================================== */

  const updateConnection = async (connectionId, status) => {
    try {
      const response = await fetch(
        `${API_URL}/api/connections/${connectionId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update connection"
        );
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === connectionId
            ? {
                ...request,
                status,
              }
            : request
        )
      );

      setMessage(
        status === "accepted"
          ? "Connection accepted! 🎉"
          : "Connection request rejected."
      );
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    }
  };

  /* =====================================================
     CAROUSEL
     MANUAL ONLY
     ===================================================== */

  const totalSlides = requests.length;

  const nextSlide = () => {
    if (totalSlides <= 1) return;

    setCurrentIndex((current) =>
      current >= totalSlides - 1
        ? 0
        : current + 1
    );
  };

  const previousSlide = () => {
    if (totalSlides <= 1) return;

    setCurrentIndex((current) =>
      current <= 0
        ? totalSlides - 1
        : current - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  /* =====================================================
     MOUSE TILT
     ===================================================== */

  const handlePointerMove = (event) => {
    const viewport = viewportRef.current;

    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();

    const mouseX =
      (event.clientX - rect.left) /
        rect.width -
      0.5;

    const mouseY =
      (event.clientY - rect.top) /
        rect.height -
      0.5;

    carouselRef.current?.style.setProperty(
      "--mzaTiltX",
      `${mouseY * -6}deg`
    );

    carouselRef.current?.style.setProperty(
      "--mzaTiltY",
      `${mouseX * 6}deg`
    );
  };

  /* =====================================================
     RESET TILT WHEN MOUSE LEAVES
     ===================================================== */

  const handlePointerLeave = () => {
    carouselRef.current?.style.setProperty(
      "--mzaTiltX",
      "0deg"
    );

    carouselRef.current?.style.setProperty(
      "--mzaTiltY",
      "0deg"
    );
  };

  /* =====================================================
     DRAG / SWIPE
     ===================================================== */

  const handlePointerDown = (event) => {
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    dragRef.current = {
      dragging: true,
      startX: event.clientX,
    };

    try {
      viewportRef.current?.setPointerCapture(
        event.pointerId
      );
    } catch {
      // Ignore pointer capture errors
    }
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current.dragging) return;

    const distance =
      event.clientX - dragRef.current.startX;

    dragRef.current.dragging = false;

    if (Math.abs(distance) > 70) {
      if (distance < 0) {
        nextSlide();
      } else {
        previousSlide();
      }
    }

    try {
      viewportRef.current?.releasePointerCapture(
        event.pointerId
      );
    } catch {
      // Ignore pointer release errors
    }
  };

  /* =====================================================
     LOGIN
     ===================================================== */

  if (!loggedInUser) {
    return (
      <section
        className="connections"
        style={{
          "--connection-bg": `url(${backgroundImage})`,
        }}
      >
        <div className="connections-empty">
          <div className="connections-empty-icon">
            🔐
          </div>

          <h3>
            Please login first
          </h3>

          <p>
            Login to see your connection requests.
          </p>
        </div>
      </section>
    );
  }

  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <section
        className="connections"
        style={{
          "--connection-bg": `url(${backgroundImage})`,
        }}
      >
        <div className="connections-loading">
          <span></span>
          Loading connections...
        </div>
      </section>
    );
  }

  /* =====================================================
     MAIN
     ===================================================== */

  return (
    <section
      className="connections"
      style={{
        "--connection-bg": `url(${backgroundImage})`,
      }}
    >
      {/* =================================================
          HEADING
          ================================================= */}

      <div className="connections-heading">
        <div className="connections-badge">
          ✦ CONNECTIONS
        </div>

        <h2>
          Your
          <span> SkillMates.</span>
        </h2>

        <p>
          People who want to connect with you.
        </p>
      </div>

      {/* =================================================
          MESSAGE
          ================================================= */}

      {message && (
        <div className="connections-message">
          {message}
        </div>
      )}

      {/* =================================================
          EMPTY
          ================================================= */}

      {requests.length === 0 ? (
        <div className="connections-empty">
          <div className="connections-empty-icon">
            🤝
          </div>

          <h3>
            No connection requests yet
          </h3>

          <p>
            Discover people and send your first
            connection request.
          </p>
        </div>
      ) : (
        /* =================================================
           CAROUSEL
           ================================================= */

        <div
          className="mzaCarousel"
          ref={carouselRef}
          aria-roledescription="carousel"
          aria-label="SkillMate connections"
        >
          <div
            className="mzaCarousel-viewport"
            ref={viewportRef}
            tabIndex="0"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <div className="mzaCarousel-track">
              {requests.map(
                (request, index) => {
                  let distance =
                    index -
                    currentIndex;

                  const half =
                    requests.length / 2;

                  if (distance > half) {
                    distance -=
                      requests.length;
                  }

                  if (distance < -half) {
                    distance +=
                      requests.length;
                  }

                  const translateX =
                    distance * 470;

                  const translateZ =
                    -Math.abs(distance) * 120;

                  const rotateY =
                    -distance * 28;

                  const scale =
                    1 -
                    Math.min(
                      Math.abs(distance) *
                        0.08,
                      0.35
                    );

                  const isActive =
                    index === currentIndex;

                  return (
                    <article
                      key={request.id}
                      className={`mzaCarousel-slide ${
                        isActive
                          ? "active"
                          : ""
                      }`}
                      style={{
                        transform: `
                          translate3d(
                            ${translateX}px,
                            -50%,
                            ${translateZ}px
                          )
                          rotateY(
                            ${rotateY}deg
                          )
                          scale(${scale})
                        `,

                        zIndex:
                          100 -
                          Math.abs(
                            distance
                          ),

                        opacity:
                          Math.abs(
                            distance
                          ) > 2
                            ? 0
                            : 1,
                      }}
                      aria-hidden={!isActive}
                    >
                      <div
                        className={`mzaCard ${
                          request.status ===
                          "accepted"
                            ? "card-accepted"
                            : request.status ===
                              "rejected"
                            ? "card-rejected"
                            : "card-pending"
                        }`}
                      >
                        {/* Background glow */}

                        <div className="mzaCard-glow"></div>

                        {/* Decorative circles */}

                        <div className="mza-decoration decoration-one"></div>

                        <div className="mza-decoration decoration-two"></div>

                        {/* Header */}

                        <header className="mzaCard-head mzaPar-1">
                        <div className="mza-avatar">
  {request.sender_profile_picture ? (
    <img
      src={`${API_URL}${request.sender_profile_picture}`}
      alt={request.sender_name}
    />
  ) : (
    <span>👤</span>
  )}
</div>
                          <div>
                            <p className="mzaCard-kicker">
                              {request.status ===
                              "pending"
                                ? "NEW CONNECTION REQUEST"
                                : request.status ===
                                  "accepted"
                                ? "SKILLMATE"
                                : "CONNECTION"}
                            </p>

                            <h2 className="mzaCard-title">
                              {request.sender_name}
                            </h2>
                          </div>
                        </header>

                        {/* Bio */}

                        <p className="mzaCard-text mzaPar-2">
                          {request.sender_bio ||
                            "This SkillMate hasn't added a bio yet."}
                        </p>

                        {/* Skills */}

                        <div className="mzaCard-skills mzaPar-2">
                          {request.sender_skills
                            ?.slice(0, 5)
                            .map(
                              (
                                skill,
                                skillIndex
                              ) => (
                                <span
                                  key={
                                    skillIndex
                                  }
                                >
                                  {skill}
                                </span>
                              )
                            )}
                        </div>

                        {/* Actions */}

                        <footer className="mzaCard-actions mzaPar-3">
                          {request.status ===
                            "pending" && (
                            <div className="mza-actions">
                              <button
                                className="mzaBtn mzaAccept"
                                onClick={(event) => {
                                  event.stopPropagation();

                                  updateConnection(
                                    request.id,
                                    "accepted"
                                  );
                                }}
                              >
                                ✓ Accept
                              </button>

                              <button
                                className="mzaBtn mzaReject"
                                onClick={(event) => {
                                  event.stopPropagation();

                                  updateConnection(
                                    request.id,
                                    "rejected"
                                  );
                                }}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}

                          {request.status ===
                            "accepted" && (
                            <div className="mzaStatus accepted-status">
                              <span>✓</span>
                              Connected
                            </div>
                          )}

                          {request.status ===
                            "rejected" && (
                            <div className="mzaStatus rejected-status">
                              <span>✕</span>
                              Request rejected
                            </div>
                          )}
                        </footer>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </div>

          {/* =================================================
              ARROWS
              ================================================= */}

          {requests.length > 1 && (
            <div
              className="mzaCarousel-controls"
              aria-label="Controls"
            >
              <button
                className="mzaCarousel-prev"
                aria-label="Previous connection"
                type="button"
                onClick={previousSlide}
              >
                ‹
              </button>

              <button
                className="mzaCarousel-next"
                aria-label="Next connection"
                type="button"
                onClick={nextSlide}
              >
                ›
              </button>
            </div>
          )}

          {/* =================================================
              DOTS
              ================================================= */}

          {requests.length > 1 && (
            <div
              className="mzaCarousel-pagination"
              role="tablist"
              aria-label="Connection navigation"
            >
              {requests.map(
                (request, index) => (
                  <button
                    key={request.id}
                    type="button"
                    className="mzaCarousel-dot"
                    aria-label={`Go to connection ${
                      index + 1
                    }`}
                    aria-selected={
                      index === currentIndex
                    }
                    onClick={() =>
                      goToSlide(index)
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Connections;