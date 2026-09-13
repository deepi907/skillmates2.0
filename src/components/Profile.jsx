import { useEffect, useState } from "react";
import Chat from "./Chat";
const API_URL = import.meta.env.VITE_API_URL;
function Profile({ userId, onBack }) {
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
const [showChat, setShowChat] = useState(false);
  const [swipe, setSwipe] = useState("");
  const [connectionMode, setConnectionMode] = useState(null);

  const [sendingRequest, setSendingRequest] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");

  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
const [galleryVisibility, setGalleryVisibility] =
  useState({});
  const [selectedConnections, setSelectedConnections] =
  useState([]);

const [showPrivacy, setShowPrivacy] = useState(null);
const [savingPrivacy, setSavingPrivacy] =
  useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const [preferences, setPreferences] = useState({
    activityType: "",
    duration: "",
    budget: "",
    preferredTime: "",
  });

  const [plan, setPlan] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const loggedInUser = JSON.parse(
    localStorage.getItem("skillmateUser")
  );

  const myInterests = loggedInUser?.skills || [];

const getInterestUploadConfig = (interest) => {
  const configs = {
    "🎨 Art": {
      accept: "image/*",
      label: "Upload artwork",
    },

    "📸 Photography": {
      accept: "image/*",
      label: "Upload photo",
    },

    "💻 Coding": {
      accept: ".js,.jsx,.ts,.tsx,.py,.java,.html,.css,.txt,.pdf,.zip",
      label: "Upload code",
    },

    "🎵 Music": {
      accept: "audio/mpeg",
      label: "Upload MP3",
    },

    "📚 Books": {
      accept: "application/pdf",
      label: "Upload book PDF",
    },

    "🎬 Movies": {
      accept: "video/*",
      label: "Upload video",
    },

    "✈️ Travel": {
      accept: "image/*,video/*",
      label: "Upload travel memory",
    },

    "🎮 Gaming": {
      accept: "image/*,video/*",
      label: "Upload gaming media",
    },
  };

  return configs[interest] || null;
};
const handleGalleryPrivacyChange = (value) => {
  setGalleryVisibility(value);

  if (value !== "selected") {
    setSelectedConnections([]);
  }
};
const handleInterestUpload = async (interest, file) => {
  if (!file) return;

  const formData = new FormData();

  formData.append("interest_media", file);
  formData.append("interest", interest);

  try {
    const response = await fetch(
      `${API_URL}/api/users/${user.id}/interest-media`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    

    if (!response.ok) {
      throw new Error(
        data.message || "Upload failed"
      );
    }

    // Update profile with the returned data
    setUser((previous) => ({
      ...previous,
      interest_media: data.user.interest_media,
    }));

    alert("Uploaded successfully! 🎉");

  } catch (error) {
    console.error(
      "Interest upload error:",
      error
    );

    alert(error.message);
  }
};

const handleInterestDelete = async (interest) => {
  const confirmed = window.confirm(
    `Delete the uploaded file for ${interest}?`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_URL}/api/users/${user.id}/interest-media`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interest,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Delete failed"
      );
    }

    setUser((previous) => ({
      ...previous,
      interest_media: data.user.interest_media,
    }));

  } catch (error) {
    console.error(
      "Interest delete error:",
      error
    );

    alert(error.message);
  }
};
  // ==========================================
  // AI PROFILE SUMMARY
  // ==========================================

  const generateAIProfileSummary = async (profileUser) => {
    if (!loggedInUser?.id || !profileUser?.id) {
      return;
    }

    setLoadingAiSummary(true);

    try {
      const response = await fetch(
        `${API_URL}/api/ai/profile-summary`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            myProfile: {
              id: loggedInUser.id,
              name: loggedInUser.name || "",
              bio: loggedInUser.bio || "",
              skills: loggedInUser.skills || [],
              learning: loggedInUser.learning || [],
            },

            matchedProfile: {
              id: profileUser.id,
              name: profileUser.name || "",
              bio: profileUser.bio || "",
              skills: profileUser.skills || [],
              learning: profileUser.learning || [],
            },

            commonInterests:
              profileUser.skills?.filter((skill) =>
                (loggedInUser.skills || []).includes(skill)
              ) || [],
          }),
        }
      );

      const data = await response.json();

      console.log(
        "AI profile summary response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to generate AI summary."
        );
      }

      setAiSummary(data.summary);
} catch (error) {
  console.error(
    "AI profile summary error:",
    error
  );

  setAiSummary({
    summary: commonInterests.length > 0
      ? `You and ${profileUser.name} share interests in ${commonInterests.join(
          ", "
        )}. This gives you a natural starting point for connecting and exploring those interests together.`
      : `${profileUser.name} may still be an interesting SkillMate because you could discover new interests and learn from each other.`,

    reasons:
      commonInterests.length > 0
        ? commonInterests.map(
            (interest) =>
              `You both like ${interest}`
          )
        : [
            "You may have an opportunity to learn from each other",
            "You could explore a new activity together",
          ],

    connectionIdea:
      "Start with a simple conversation about one of your interests.",
  });

} finally {
      setLoadingAiSummary(false);
    }
  };
useEffect(() => {
  if (!user?.id || loggedInUser?.id !== user.id) return;

  const fetchConnections = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/connections/${user.id}/accepted`
      );

      if (!response.ok) {
        throw new Error("Failed to load connections");
      }

      const data = await response.json();
      setConnections(data);
    } catch (error) {
      console.error("Connections load error:", error);
    }
  };

  fetchConnections();
}, [user?.id]);
useEffect(() => {
  if (!user) return;

  setGalleryVisibility(
    user.interest_gallery_visibility || "everyone"
  );

  setSelectedConnections(
    user.interest_gallery_allowed_connections || []
  );
}, [user]);
  // ==========================================
  // FETCH PROFILE
  // ==========================================

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/api/users/${userId}?viewerId=${loggedInUser.id}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load profile"
          );
        }

      const data = await response.json();

console.log("PROFILE DATA:", data);
console.log(
  "PROFILE INTEREST MEDIA:",
  JSON.stringify(data.interest_media, null, 2)
);
setUser(data);

        // Generate real AI profile summary
        generateAIProfileSummary(data);

      } catch (error) {
        console.error(
          "Profile error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);


  // ==========================================
  // MATCH PERCENTAGE
  // ==========================================

  const getMatchPercentage = () => {
    if (
      !myInterests.length ||
      !user?.skills?.length
    ) {
      return 0;
    }

    const common = user.skills.filter((skill) =>
      myInterests.includes(skill)
    );

    return Math.round(
      (common.length / myInterests.length) * 100
    );
  };


  // ==========================================
  // COMMON INTERESTS
  // ==========================================

  const getCommonInterests = () => {
    if (!user?.skills) {
      return [];
    }

    return user.skills.filter((skill) =>
      myInterests.includes(skill)
    );
  };


  // ==========================================
  // GREAT CHOICE / SEND CONNECTION
  // ==========================================

  const handleGreatChoice = async () => {
    if (sendingRequest) {
      return;
    }

    if (!loggedInUser?.id) {
      setConnectionMessage(
        "Please login before sending a connection request."
      );
      return;
    }

    if (!user?.id) {
      setConnectionMessage(
        "User profile not found."
      );
      return;
    }

    setSendingRequest(true);
    setConnectionMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/connections`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            senderId: loggedInUser.id,
            receiverId: user.id,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "Connection response:",
        response.status,
        data
      );

      // Already exists
      if (
        response.status === 409 &&
        data.message ===
          "Connection request already sent"
      ) {
        setConnectionMessage(
          "Connection request already exists. 💚"
        );

        setConnectionMode("choose");
        return;
      }

      if (!response.ok) {
        setConnectionMessage(
          data.message ||
            "Could not send connection request."
        );

        return;
      }

      setConnectionMessage(
        "Connection request sent! 💚"
      );

      setConnectionMode("choose");

    } catch (error) {
      console.error(
        "Connection request error:",
        error
      );

      setConnectionMessage(
        "Could not connect to the server."
      );

    } finally {
      setSendingRequest(false);
    }
  };


  // ==========================================
  // REJECT
  // ==========================================

  const handleReject = () => {
    if (swipe) {
      return;
    }

    setSwipe("right");

    setTimeout(() => {
      onBack();
    }, 400);
  };


  // ==========================================
  // QUESTIONNAIRE CHANGE
  // ==========================================

  const handlePreferenceChange = (event) => {
    const { name, value } = event.target;

    setPreferences((current) => ({
      ...current,
      [name]: value,
    }));
  };


  // ==========================================
  // START QUESTIONNAIRE
  // ==========================================

  const startQuestionnaire = () => {
    setPlan(null);
    setConnectionMessage("");

    setPreferences({
      activityType: "",
      duration: "",
      budget: "",
      preferredTime: "",
    });

    setShowQuestionnaire(true);
  };


  // ==========================================
  // GENERATE REAL AI PLAN
  // ==========================================

  const generatePlan = async () => {
    if (
      !preferences.activityType ||
      !preferences.duration ||
      !preferences.budget ||
      !preferences.preferredTime
    ) {
      setConnectionMessage(
        "Please answer all four questions first."
      );

      return;
    }

    if (!loggedInUser?.id || !user?.id) {
      setConnectionMessage(
        "User information is missing."
      );

      return;
    }

    if (
      connectionMode !== "virtual" &&
      connectionMode !== "offline"
    ) {
      setConnectionMessage(
        "Please choose Virtual or Offline first."
      );

      return;
    }

    setGeneratingPlan(true);
    setConnectionMessage("");
    setPlan(null);

    try {
      const response = await fetch(
        `${API_URL}/api/ai/plan`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            mode: connectionMode,

            myProfile: {
              id: loggedInUser.id,
              name: loggedInUser.name || "",
              bio: loggedInUser.bio || "",
              skills: loggedInUser.skills || [],
              learning:
                loggedInUser.learning || [],
            },

            matchedProfile: {
              id: user.id,
              name: user.name || "",
              bio: user.bio || "",
              skills: user.skills || [],
              learning:
                user.learning || [],
            },

            commonInterests:
              getCommonInterests(),

            preferences,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "AI plan response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to generate AI plan."
        );
      }

      if (!data.plan) {
        throw new Error(
          "AI did not return a plan."
        );
      }

      setPlan(data.plan);
      setShowQuestionnaire(false);

    } catch (error) {
      console.error(
        "AI planning error:",
        error
      );

      setConnectionMessage(
        error.message ||
          "Could not generate AI plan."
      );

    } finally {
      setGeneratingPlan(false);
    }
  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <section className="profile-page">
        <p>
          Loading profile...
        </p>
      </section>
    );
  }


  // ==========================================
  // PROFILE NOT FOUND
  // ==========================================

  if (!user) {
    return (
      <section className="profile-page">
    
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <h2>
          Profile not found
        </h2>

      </section>
    );
  }


  const matchPercentage =
    getMatchPercentage();

  const commonInterests =
    getCommonInterests();


  // ==========================================
  // PROFILE PAGE
  // ==========================================

  return (
    <section className="profile-page">

      {/* BACK */}

      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← Back to Discover
      </button>


      {/* PROFILE CARD */}

      <div
        className={`full-profile-card ${
          swipe === "left"
            ? "swipe-left"
            : swipe === "right"
            ? "swipe-right"
            : ""
        }`}
      >

        {/* AI BADGE */}

        <div className="ai-profile-badge">
          ✦ AI RECOMMENDED
        </div>


  {/* AVATAR */}

<div className="large-profile-avatar">
  {user.profile_picture ? (
    <img
      src={`${API_URL}${user.profile_picture}`}
      alt={user.name}
    />
  ) : (
    <span>👤</span>
  )}
</div>

        {/* NAME */}

        <h1>
          {user.name}
        </h1>


        {/* MATCH */}

        <div className="profile-match">

          <strong>
            {matchPercentage}%
          </strong>

          <span>
            Common Ground
          </span>

        </div>


        {/* BIO */}

        <div className="profile-section">

          <h3>
            ✦ About this person
          </h3>

          <p>
            {user.bio ||
              "This person hasn't added a bio yet."}
          </p>

        </div>


        {/* WHY AI RECOMMENDS */}

        <div className="profile-section">

          <h3>
            ✦ Why AI recommends them
          </h3>

          {commonInterests.length > 0 ? (

            <div className="common-interests">

              {commonInterests.map(
                (interest, index) => (

                  <span key={index}>
                    ✓ You both like {interest}
                  </span>

                )
              )}

            </div>

          ) : (

            <p>
              You don't have shared interests yet,
              but you may still have something
              interesting to learn from each other.
            </p>

          )}

        </div>


        {/* THEIR INTERESTS */}

      {/* THEIR INTERESTS */}

<div className="profile-section">

  <h3>
    ✦ Their interests
  </h3>

  <div className="interest-gallery">

    {user.skills?.length > 0 ? (

      user.skills.map((skill, index) => {

        const uploadConfig =
          getInterestUploadConfig(skill);

        return (
          <div
            className="interest-card"
            key={index}
          >

            {/* INTEREST IMAGE / MEDIA */}

            <div className="interest-image">

              {user.interest_media?.[skill] ? (

                user.interest_media[skill].type.startsWith("image/") ? (

                  <img
                    src={`${API_URL}${user.interest_media[skill].url}`}
                    alt={skill}
                  />

                ) : user.interest_media[skill].type.startsWith("audio/") ? (

                  <audio
                    controls
                    src={`${API_URL}${user.interest_media[skill].url}`}
                  />

                ) : user.interest_media[skill].type.startsWith("video/") ? (

                  <video
                    controls
                    src={`${API_URL}${user.interest_media[skill].url}`}
                  />

                ) : user.interest_media[skill].type === "application/pdf" ? (

                  <a
                    href={`${API_URL}${user.interest_media[skill].url}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📄 View PDF
                  </a>

                ) : (

                  <a
                    href={`${API_URL}${user.interest_media[skill].url}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📎 Open file
                  </a>

                )

              ) : (

                skill.split(" ")[0]

              )}

            </div>


            {/* INTEREST NAME */}

            <span>
              {skill}
            </span>


            {/* UPLOAD SECTION */}

            {uploadConfig && (

              <div className="interest-upload">

                <label>
                  {uploadConfig.label}

                  <input
                    type="file"
                    accept={uploadConfig.accept}
                    style={{ display: "none" }}
                    onChange={(event) =>
                      handleInterestUpload(
                        skill,
                        event.target.files[0]
                      )
                    }
                  />

                </label>


                {/* DELETE + PRIVACY */}

              

                {/* INTEREST ACTIONS */}

<div className="interest-actions">

  {/* DELETE — only when media exists */}
  {user.interest_media?.[skill] && (
    <button
      type="button"
      className="interest-delete"
      onClick={() => handleInterestDelete(skill)}
    >
      🗑 Delete
    </button>
  )}

  {/* PRIVACY — always show for profile owner */}
  
    <button
      type="button"
      className="interest-privacy"
      onClick={() =>
        setShowPrivacy(
          showPrivacy === skill ? null : skill
        )
      }
      title="Gallery privacy"
    >
      🔒
    </button>
  

</div>


                    {/* PRIVACY MENU */}

                    {
                      showPrivacy === skill && (

                      <div className="gallery-privacy-menu">

                        <p>
                          Who can see this gallery?
                        </p>


                        {/* EVERYONE */}

                        <label>

                          <input
                            type="radio"
                            name={`gallery-privacy-${skill}`}
                            value="everyone"
                            checked={
                              galleryVisibility ===
                              "everyone"
                            }
                            onChange={() => {
                              handleGalleryPrivacyChange(
                                "everyone"
                              );

                              setShowPrivacy(null);
                            }}
                          />

                          🌍 Everyone

                        </label>


                        {/* CONNECTIONS */}

                        <label>

                          <input
                            type="radio"
                            name={`gallery-privacy-${skill}`}
                            value="connections"
                            checked={
                              galleryVisibility ===
                              "connections"
                            }
                            onChange={() => {
                              handleGalleryPrivacyChange(
                                "connections"
                              );

                              setShowPrivacy(null);
                            }}
                          />

                          🤝 My Connections

                        </label>


                        {/* SELECTED CONNECTIONS */}

                        <label>

                          <input
                            type="radio"
                            name={`gallery-privacy-${skill}`}
                            value="selected"
                            checked={
                              galleryVisibility ===
                              "selected"
                            }
                            onChange={() =>
                              handleGalleryPrivacyChange(
                                "selected"
                              )
                            }
                          />

                          👥 Selected Connections

                        </label>


                        {/* ONLY ME */}

                        <label>

                          <input
                            type="radio"
                            name={`gallery-privacy-${skill}`}
                            value="only_me"
                            checked={
                              galleryVisibility ===
                              "only_me"
                            }
                            onChange={() => {
                              handleGalleryPrivacyChange(
                                "only_me"
                              );

                              setShowPrivacy(null);
                            }}
                          />

                          🔒 Only Me

                        </label>


                        {/* SELECTED CONNECTION LIST */}

                        {galleryVisibility ===
                          "selected" && (

                          <div className="selected-connections">

                            <h4>
                              Selected Connections
                            </h4>


                            {connections.length > 0 ? (

                              connections.map(
                                (connection) => (

                                  <label
                                    key={connection.id}
                                    className="connection-option"
                                  >

                                    <input
                                      type="checkbox"
                                      checked={selectedConnections.includes(
                                        connection.id
                                      )}
                                      onChange={(event) => {

                                        if (
                                          event.target.checked
                                        ) {

                                          setSelectedConnections(
                                            (previous) => [

                                              ...previous,

                                              connection.id,

                                            ]
                                          );

                                        } else {

                                          setSelectedConnections(
                                            (previous) =>
                                              previous.filter(
                                                (id) =>
                                                  id !==
                                                  connection.id
                                              )
                                          );

                                        }

                                      }}
                                    />

                                    {connection.name}

                                  </label>

                                )
                              )

                            ) : (

                              <p>
                                No accepted connections yet.
                              </p>

                            )}

                          </div>

                        )}

                      </div>

                    )}

                

              

              </div>

            )}

          </div>
        );

      })

    ) : (

      <p>
        No interests added yet.
      </p>

    )}

  </div>

</div>


        {/* LEARNING */}

        {user.learning?.length > 0 && (

          <div className="profile-section">

            <h3>
              ✦ Wants to learn
            </h3>

            <div className="profile-tags">

              {user.learning.map(
                (item, index) => (

                  <span key={index}>
                    {item}
                  </span>

                )
              )}

            </div>

          </div>

        )}


        {/* AI SUMMARY */}

        <div className="ai-summary">

          <h3>
            ✦ AI Summary
          </h3>

          {loadingAiSummary ? (

            <p>
              ✦ AI is analyzing your compatibility...
            </p>

          ) : aiSummary ? (

            <>
              <p>
                {aiSummary.summary}
              </p>

              {aiSummary.reasons?.length > 0 && (

                <div className="common-interests">

                  {aiSummary.reasons.map(
                    (reason, index) => (

                      <span key={index}>
                        ✓ {reason}
                      </span>

                    )
                  )}

                </div>

              )}

              {aiSummary.connectionIdea && (

                <p>

                  <strong>
                    💡 Good way to start:
                  </strong>{" "}

                  {aiSummary.connectionIdea}

                </p>

              )}

            </>

          ) : (

            <p>
              AI summary couldn't be generated.
            </p>

          )}

        </div>

{/* CHAT */}

<div className="profile-chat-section">

  <button
    type="button"
    className="chat-profile-button"
    onClick={() => setShowChat(true)}
  >
    💬 Chat with {user.name}
  </button>

</div>

        {/* CONNECTION MESSAGE */}

        {connectionMessage && (

          <div className="connection-message">
            {connectionMessage}
          </div>

        )}


        {/* GREAT CHOICE / REJECT */}

        {connectionMode === null &&
          !showQuestionnaire &&
          !plan && (

          <div className="swipe-actions">

            <button
              type="button"
              className="great-choice-button"
              onClick={handleGreatChoice}
              disabled={sendingRequest}
            >

              {sendingRequest
                ? "Connecting..."
                : "← Great Choice"}

            </button>


            <button
              type="button"
              className="reject-profile-button"
              onClick={handleReject}
              disabled={sendingRequest}
            >
              Reject →
            </button>

          </div>

        )}


        {/* VIRTUAL / OFFLINE SELECTION */}

        {connectionMode === "choose" &&
          !showQuestionnaire &&
          !plan && (

          <div className="connection-mode">

            <div className="badge">
              ✦ GREAT CHOICE
            </div>

            <h2>
              How would you like to connect?
            </h2>

            <p>
              Choose how you would like to meet.
              AI will create a personalized
              experience for both of you.
            </p>

            <div className="mode-options">

              {/* VIRTUAL */}

              <button
                type="button"
                className="mode-card"
                onClick={() => {
                  setConnectionMode("virtual");
                  setShowQuestionnaire(false);
                  setPlan(null);
                }}
              >

                <div className="mode-icon">
                  💻
                </div>

                <h3>
                  Virtual
                </h3>

                <p>
                  Connect online through a
                  personalized activity.
                </p>

                <span>
                  Choose Virtual →
                </span>

              </button>


              {/* OFFLINE */}

              <button
                type="button"
                className="mode-card"
                onClick={() => {
                  setConnectionMode("offline");
                  setShowQuestionnaire(false);
                  setPlan(null);
                }}
              >

                <div className="mode-icon">
                  📍
                </div>

                <h3>
                  Offline
                </h3>

                <p>
                  Meet in person with an
                  AI-planned activity.
                </p>

                <span>
                  Choose Offline →
                </span>

              </button>

            </div>

          </div>

        )}


        {/* VIRTUAL */}

        {connectionMode === "virtual" &&
          !showQuestionnaire &&
          !plan && (

          <div className="connection-mode">

            <div className="badge">
              💻 VIRTUAL CONNECTION
            </div>

            <h2>
              Plan your virtual experience
            </h2>

            <p>
              Answer a few questions and AI
              will create a personalized
              experience for you and {user.name}.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={startQuestionnaire}
            >
              Start AI Planning →
            </button>

          </div>

        )}


        {/* OFFLINE */}

        {connectionMode === "offline" &&
          !showQuestionnaire &&
          !plan && (

          <div className="connection-mode">

            <div className="badge">
              📍 OFFLINE CONNECTION
            </div>

            <h2>
              Plan your meetup
            </h2>

            <p>
              Answer a few questions and AI
              will create a personalized
              meetup for you and {user.name}.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={startQuestionnaire}
            >
              Start AI Planning →
            </button>

          </div>

        )}


        {/* QUESTIONNAIRE */}

        {showQuestionnaire && !plan && (

          <div className="ai-questionnaire">

            <div className="badge">
              ✦ AI PLANNING
            </div>

            <h2>
              Let's create your perfect plan
            </h2>

            <p>
              Answer these questions and AI will
              personalize the experience for you
              and {user.name}.
            </p>


            <div className="question-group">

              <label>
                What would you like to do?
              </label>

              <select
                name="activityType"
                value={preferences.activityType}
                onChange={handlePreferenceChange}
              >

                <option value="">
                  Select an activity
                </option>

                <option value="creative">
                  🎨 Creative activity
                </option>

                <option value="learning">
                  📚 Learning
                </option>

                <option value="games">
                  🎮 Games
                </option>

                <option value="conversation">
                  ☕ Conversation
                </option>

                <option value="hobby">
                  ✨ Shared hobby
                </option>

              </select>

            </div>


            <div className="question-group">

              <label>
                How much time do you have?
              </label>

              <select
                name="duration"
                value={preferences.duration}
                onChange={handlePreferenceChange}
              >

                <option value="">
                  Select duration
                </option>

                <option value="30 minutes">
                  30 minutes
                </option>

                <option value="1 hour">
                  1 hour
                </option>

                <option value="2 hours">
                  2 hours
                </option>

                <option value="3+ hours">
                  3+ hours
                </option>

              </select>

            </div>


            <div className="question-group">

              <label>
                What's your budget?
              </label>

              <select
                name="budget"
                value={preferences.budget}
                onChange={handlePreferenceChange}
              >

                <option value="">
                  Select budget
                </option>

                <option value="Free">
                  🆓 Free
                </option>

                <option value="Under ₹500">
                  Under ₹500
                </option>

                <option value="₹500 - ₹1000">
                  ₹500 - ₹1000
                </option>

                <option value="₹1000+">
                  ₹1000+
                </option>

              </select>

            </div>


            <div className="question-group">

              <label>
                When would you prefer?
              </label>

              <select
                name="preferredTime"
                value={preferences.preferredTime}
                onChange={handlePreferenceChange}
              >

                <option value="">
                  Select preferred time
                </option>

                <option value="Morning">
                  🌅 Morning
                </option>

                <option value="Afternoon">
                  ☀️ Afternoon
                </option>

                <option value="Evening">
                  🌆 Evening
                </option>

                <option value="Night">
                  🌙 Night
                </option>

              </select>

            </div>


            <button
              type="button"
              className="primary-button"
              onClick={generatePlan}
              disabled={generatingPlan}
            >

              {generatingPlan
                ? "✦ AI is creating your plan..."
                : "✦ Generate My AI Plan →"}

            </button>

          </div>

        )}


        {/* AI PERSONALIZED PLAN */}

        {plan && (

          <div className="ai-plan">

            <div className="badge">
              ✦ AI PERSONALIZED PLAN
            </div>

            <h2>
              {plan.title}
            </h2>

            <p>
              Here's a personalized experience
              created for you and {user.name}.
            </p>


            <div className="plan-card">

              <div className="plan-icon">
                {connectionMode === "virtual"
                  ? "💻"
                  : "📍"}
              </div>

              <h3>
                Recommended Activity
              </h3>

              <p>
                {plan.activity}
              </p>

            </div>


            <div className="plan-details">

              <div>
                <strong>
                  ⏱ Duration
                </strong>

                <span>
                  {plan.duration}
                </span>
              </div>

              <div>
                <strong>
                  💰 Budget
                </strong>

                <span>
                  {plan.budget}
                </span>
              </div>

              <div>
                <strong>
                  🕐 Preferred Time
                </strong>

                <span>
                  {plan.preferredTime}
                </span>
              </div>

            </div>


            <div className="ai-summary">

              <h3>
                ✦ Why AI chose this
              </h3>

              <p>
                {plan.why}
              </p>

            </div>


            {plan.steps?.length > 0 && (

              <div className="plan-card">

                <h3>
                  ✦ Your Plan
                </h3>

                <div className="plan-steps">

                  {plan.steps.map(
                    (step, index) => (

                    <div
                      key={index}
                      className="plan-step"
                    >

                      <strong>
                        {index + 1}.
                      </strong>

                      <span>
                        {step}
                      </span>

                    </div>

                  ))}

                </div>

              </div>

            )}


            {connectionMode === "offline" &&
              plan.safety?.length > 0 && (

              <div className="ai-summary safety-box">

                <h3>
                  🛡️ AI Safety Suggestions
                </h3>

                {plan.safety.map(
                  (item, index) => (

                    <p key={index}>
                      ✓ {item}
                    </p>

                  )
                )}

              </div>

            )}


            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setPlan(null);
                setShowQuestionnaire(true);
              }}
            >
              ← Change Preferences
            </button>

          </div>

        )}
        {/* CHAT WINDOW */}

{showChat && (
  <Chat
    user={user}
    onClose={() => setShowChat(false)}
  />
)}

      </div>

    </section>
  );
}

export default Profile;