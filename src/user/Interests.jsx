import { useEffect, useRef, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;
function Interests({ user, setUser }) {

  const skillsList = Array.isArray(user?.skills)
    ? user.skills
    : [];

  const fileInputRefs = useRef({});

  const [interestMedia, setInterestMedia] = useState(
    user?.interest_media || {}
  );

  const [uploadingSkill, setUploadingSkill] = useState(null);

  const [openPrivacy, setOpenPrivacy] = useState(null);

  const [savingPrivacy, setSavingPrivacy] = useState(null);

  const [interestPrivacy, setInterestPrivacy] = useState(
    user?.interest_gallery_privacy || {}
  );

  // =====================================================
  // KEEP LOCAL MEDIA IN SYNC
  // =====================================================

  useEffect(() => {
    setInterestMedia(user?.interest_media || {});
  }, [user?.interest_media]);

  // =====================================================
  // KEEP PRIVACY IN SYNC
  // =====================================================

  useEffect(() => {
    setInterestPrivacy(
      user?.interest_gallery_privacy || {}
    );
  }, [user?.interest_gallery_privacy]);

  // =====================================================
  // UPLOAD INTEREST MEDIA
  // =====================================================

  const handleInterestUpload = async (interest, file) => {
    if (!file || !user?.id) {
      return;
    }

    setUploadingSkill(interest);

    const formData = new FormData();

    formData.append(
      "interest_media",
      file
    );

    formData.append(
      "interest",
      interest
    );

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
        console.log(
          "BACKEND ERROR:",
          data
        );

        throw new Error(
          data.message || "Upload failed"
        );
      }

      console.log(
        "UPLOAD SUCCESS:",
        data
      );

      // -----------------------------------------------
      // UPDATE MEDIA
      // -----------------------------------------------

      const updatedMedia =
        data.user?.interest_media || {};

      setInterestMedia(
        updatedMedia
      );

      // -----------------------------------------------
      // UPDATE PARENT USER
      // -----------------------------------------------

      if (setUser && data.user) {
        setUser((previous) => ({
          ...previous,
          interest_media:
            updatedMedia,
        }));
      }

      // -----------------------------------------------
      // UPDATE LOCAL STORAGE
      // -----------------------------------------------

      const storedUser =
        localStorage.getItem("skillmateUser");

      if (storedUser && data.user) {
        try {
          const currentUser =
            JSON.parse(storedUser);

          localStorage.setItem(
            "skillmateUser",
            JSON.stringify({
              ...currentUser,
              interest_media:
                updatedMedia,
            })
          );
        } catch (storageError) {
          console.error(
            "LOCAL STORAGE ERROR:",
            storageError
          );
        }
      }
    } catch (error) {
      console.error(
        "Interest upload error:",
        error
      );

      alert(error.message);
    } finally {
      setUploadingSkill(null);
    }
  };

  // =====================================================
  // DELETE INTEREST MEDIA
  // =====================================================

  const handleInterestDelete = async (interest) => {
    if (!user?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete the uploaded file for ${interest}?`
    );

    if (!confirmed) {
      return;
    }

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

      console.log(
        "DELETE SUCCESS:",
        data
      );

      // -----------------------------------------------
      // UPDATE MEDIA
      // -----------------------------------------------

      const updatedMedia =
        data.user?.interest_media || {};

      setInterestMedia(
        updatedMedia
      );

      // -----------------------------------------------
      // UPDATE PARENT USER
      // -----------------------------------------------

      if (setUser && data.user) {
        setUser((previous) => ({
          ...previous,
          interest_media:
            updatedMedia,
        }));
      }

      // -----------------------------------------------
      // UPDATE LOCAL STORAGE
      // -----------------------------------------------

      const storedUser =
        localStorage.getItem("skillmateUser");

      if (storedUser && data.user) {
        try {
          const currentUser =
            JSON.parse(storedUser);

          localStorage.setItem(
            "skillmateUser",
            JSON.stringify({
              ...currentUser,
              interest_media:
                updatedMedia,
            })
          );
        } catch (storageError) {
          console.error(
            "LOCAL STORAGE ERROR:",
            storageError
          );
        }
      }
    } catch (error) {
      console.error(
        "Interest delete error:",
        error
      );

      alert(error.message);
    }
  };

  // =====================================================
  // SAVE PRIVACY FOR ONE INTEREST
  // =====================================================

  const handlePrivacyChange = async (
    interest,
    visibility
  ) => {
    if (!user?.id) {
      return;
    }

    if (savingPrivacy === interest) {
      return;
    }

    setSavingPrivacy(interest);

    try {
      const response = await fetch(
        `${API_URL}/api/users/${user.id}/interest-gallery-privacy/interest`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            interest,
            visibility,
          }),
        }
      );

      const responseText =
        await response.text();

      console.log(
        "PRIVACY RESPONSE STATUS:",
        response.status
      );

      console.log(
        "PRIVACY RESPONSE:",
        responseText
      );

      let data;

      try {
        data = JSON.parse(
          responseText
        );
      } catch (parseError) {
        throw new Error(
          `Server returned invalid response: ${responseText}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update privacy"
        );
      }

      console.log(
        "PRIVACY UPDATED:",
        data
      );

      // -----------------------------------------------
      // UPDATE PRIVACY STATE
      // -----------------------------------------------

      const updatedPrivacy =
        data.user?.interest_gallery_privacy || {};

      setInterestPrivacy(
        updatedPrivacy
      );

      // -----------------------------------------------
      // UPDATE PARENT USER
      // -----------------------------------------------

      if (setUser && data.user) {
        setUser((previous) => ({
          ...previous,

          interest_gallery_privacy:
            updatedPrivacy,
        }));
      }

      // -----------------------------------------------
      // UPDATE LOCAL STORAGE
      // -----------------------------------------------

      const storedUser =
        localStorage.getItem(
          "skillmateUser"
        );

      if (storedUser) {
        try {
          const currentUser =
            JSON.parse(storedUser);

          localStorage.setItem(
            "skillmateUser",
            JSON.stringify({
              ...currentUser,

              interest_gallery_privacy:
                updatedPrivacy,
            })
          );
        } catch (storageError) {
          console.error(
            "LOCAL STORAGE ERROR:",
            storageError
          );
        }
      }

      // -----------------------------------------------
      // CLOSE PRIVACY MENU
      // -----------------------------------------------

      setOpenPrivacy(null);
    } catch (error) {
      console.error(
        "Privacy update error:",
        error
      );

      alert(error.message);
    } finally {
      setSavingPrivacy(null);
    }
  };

  // =====================================================
  // GET PRIVACY LABEL
  // =====================================================

  const getPrivacyLabel = (interest) => {
    const privacy =
      interestPrivacy?.[interest] ||
      "everyone";

    switch (privacy) {
      case "everyone":
        return "Everyone";

      case "connections":
        return "My Connections";

      case "selected":
        return "Selected Connections";

      case "only_me":
        return "Only Me";

      default:
        return "Everyone";
    }
  };

  // =====================================================
  // GET PRIVACY ICON
  // =====================================================

  const getPrivacyIcon = (interest) => {
    const privacy =
      interestPrivacy?.[interest] ||
      "everyone";

    switch (privacy) {
      case "everyone":
        return "🌍";

      case "connections":
        return "🤝";

      case "selected":
        return "👥";

      case "only_me":
        return "🔒";

      default:
        return "🌍";
    }
  };

  // =====================================================
  // RENDER MEDIA
  // =====================================================

  const renderInterestMedia = (skill) => {
    const media =
      interestMedia?.[skill];

    // -----------------------------------------------
    // NO MEDIA
    // -----------------------------------------------

    if (!media) {
      return (
        <div className="dashboard-interest-media-placeholder">
          <span>
            📁
          </span>

          <p>
            No media uploaded yet
          </p>
        </div>
      );
    }

    const mediaUrl =
      `${API_URL}${media.url}`;

    // -----------------------------------------------
    // IMAGE
    // -----------------------------------------------

    if (
      media.type?.startsWith("image/")
    ) {
      return (
        <div className="dashboard-interest-media-preview">
          <img
            src={mediaUrl}
            alt={skill}
          />
        </div>
      );
    }

    // -----------------------------------------------
    // AUDIO
    // -----------------------------------------------

    if (
      media.type?.startsWith("audio/")
    ) {
      return (
        <div className="dashboard-interest-media-preview">
          <audio
            controls
            src={mediaUrl}
          />
        </div>
      );
    }

    // -----------------------------------------------
    // VIDEO
    // -----------------------------------------------

    if (
      media.type?.startsWith("video/")
    ) {
      return (
        <div className="dashboard-interest-media-preview">
          <video
            controls
            src={mediaUrl}
          />
        </div>
      );
    }

    // -----------------------------------------------
    // PDF
    // -----------------------------------------------

    if (
      media.type ===
      "application/pdf"
    ) {
      return (
        <div className="dashboard-interest-media-file">
          <span>
            📄
          </span>

          <a
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
          >
            View PDF
          </a>
        </div>
      );
    }

    // -----------------------------------------------
    // OTHER FILE
    // -----------------------------------------------

    return (
      <div className="dashboard-interest-media-file">
        <span>
          📎
        </span>

        <a
          href={mediaUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open file
        </a>
      </div>
    );
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="dashboard-content">

      {/* ==========================================
          PAGE HEADING
      ========================================== */}

      <div className="page-heading">

        <p className="dashboard-eyebrow">
          YOUR INTERESTS
        </p>

        <h1>
          My Interests 💡
        </h1>

        <p>
          Showcase your skills, hobbies and passions.
        </p>

      </div>

      {/* ==========================================
          INTERESTS GRID
      ========================================== */}

      <div className="dashboard-interests-grid">

        {skillsList.length === 0 ? (

          <div className="coming-soon-card">

            <span>
              💡
            </span>

            <h2>
              No Interests Added Yet
            </h2>

            <p>
              Add your skills and interests from
              your profile.
            </p>

          </div>

        ) : (

          skillsList.map((skill, index) => {

            const media =
              interestMedia?.[skill];

            const isUploading =
              uploadingSkill === skill;

            const isSavingPrivacy =
              savingPrivacy === skill;

            const currentPrivacy =
              interestPrivacy?.[skill] ||
              "everyone";

            return (

              <div
                className="dashboard-interest-card"
                key={`${skill}-${index}`}
              >

                {/* ==================================
                    HEADER
                ================================== */}

                <div className="dashboard-interest-card-header">

                  <div>

                    <span className="card-label">
                      INTEREST
                    </span>

                    <h2>
                      {skill}
                    </h2>

                  </div>

                  <span className="interest-card-icon">
                    💡
                  </span>

                </div>

                {/* ==================================
                    MEDIA AREA
                ================================== */}

                {renderInterestMedia(skill)}

                {/* ==================================
                    ACTIONS
                ================================== */}

                <div className="interest-actions">

                  {/* UPLOAD / REPLACE */}

                  <button
                    type="button"
                    className="interest-upload-button"
                    disabled={isUploading}
                    onClick={() =>
                      fileInputRefs.current[
                        skill
                      ]?.click()
                    }
                  >
                    {isUploading
                      ? "Uploading..."
                      : media
                      ? "🔄 Replace Media"
                      : "📤 Upload Media"}
                  </button>

                  {/* HIDDEN FILE INPUT */}

                  <input
                    type="file"

                    ref={(element) => {
                      fileInputRefs.current[
                        skill
                      ] = element;
                    }}

                    accept="
                      image/*,
                      video/*,
                      audio/*,
                      .pdf,
                      .js,
                      .jsx,
                      .ts,
                      .tsx,
                      .py,
                      .java,
                      .html,
                      .css,
                      .txt,
                      .zip
                    "

                    hidden

                    onChange={(event) => {

                      const file =
                        event.target.files?.[0];

                      if (file) {
                        handleInterestUpload(
                          skill,
                          file
                        );
                      }

                      event.target.value =
                        "";
                    }}
                  />

                  {/* DELETE */}

                  {media && (

                    <button
                      type="button"
                      className="interest-delete-button"

                      onClick={() =>
                        handleInterestDelete(
                          skill
                        )
                      }
                    >
                      🗑 Delete
                    </button>

                  )}

                </div>

                {/* ==================================
                    PRIVACY
                ================================== */}

                <div className="dashboard-interest-privacy">

                  {/* PRIVACY BUTTON */}

                  <button
                    type="button"

                    className="dashboard-interest-privacy-button"

                    disabled={isSavingPrivacy}

                    onClick={() =>
                      setOpenPrivacy(
                        openPrivacy === skill
                          ? null
                          : skill
                      )
                    }
                  >

                    <span>

                      {getPrivacyIcon(skill)}

                      {" "}

                      Gallery Privacy:{" "}

                      {getPrivacyLabel(skill)}

                    </span>

                    <span>

                      {isSavingPrivacy
                        ? "..."
                        : openPrivacy === skill
                        ? "▲"
                        : "▼"}

                    </span>

                  </button>

                  {/* PRIVACY MENU */}

                  {openPrivacy === skill && (

                    <div className="dashboard-interest-privacy-menu">

                      {/* EVERYONE */}

                      <button
                        type="button"

                        className={
                          currentPrivacy ===
                          "everyone"
                            ? "active"
                            : ""
                        }

                        onClick={() =>
                          handlePrivacyChange(
                            skill,
                            "everyone"
                          )
                        }
                      >

                        <span>
                          🌍 Everyone
                        </span>

                        {currentPrivacy ===
                          "everyone" && (
                          <span>
                            ✓
                          </span>
                        )}

                      </button>

                      {/* CONNECTIONS */}

                      <button
                        type="button"

                        className={
                          currentPrivacy ===
                          "connections"
                            ? "active"
                            : ""
                        }

                        onClick={() =>
                          handlePrivacyChange(
                            skill,
                            "connections"
                          )
                        }
                      >

                        <span>
                          🤝 My Connections
                        </span>

                        {currentPrivacy ===
                          "connections" && (
                          <span>
                            ✓
                          </span>
                        )}

                      </button>

                      {/* SELECTED CONNECTIONS */}

                      <button
                        type="button"

                        className={
                          currentPrivacy ===
                          "selected"
                            ? "active"
                            : ""
                        }

                        onClick={() =>
                          handlePrivacyChange(
                            skill,
                            "selected"
                          )
                        }
                      >

                        <span>
                          👥 Selected Connections
                        </span>

                        {currentPrivacy ===
                          "selected" && (
                          <span>
                            ✓
                          </span>
                        )}

                      </button>

                      {/* ONLY ME */}

                      <button
                        type="button"

                        className={
                          currentPrivacy ===
                          "only_me"
                            ? "active"
                            : ""
                        }

                        onClick={() =>
                          handlePrivacyChange(
                            skill,
                            "only_me"
                          )
                        }
                      >

                        <span>
                          🔒 Only Me
                        </span>

                        {currentPrivacy ===
                          "only_me" && (
                          <span>
                            ✓
                          </span>
                        )}

                      </button>

                    </div>

                  )}

                </div>

              </div>

            );

          })

        )}

      </div>

    </div>
  );
}

export default Interests;