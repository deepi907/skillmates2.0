import { useEffect, useState } from "react";
import { MorphicBackground } from "./morhic-background";
const API_URL = import.meta.env.VITE_API_URL;
function Discover({ onViewProfile, onViewAll }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  
  const loggedInUser = JSON.parse(
    localStorage.getItem("skillmateUser")
  );

  const myInterests = loggedInUser?.skills || [];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/users`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();

        const otherUsers = data.filter(
          (user) => user.id !== loggedInUser?.id
        );

        setUsers(otherUsers);
      } catch (error) {
        console.error(error);
        setError("Could not load SkillMates.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getCommonGround = (skills = []) => {
    const common = skills.filter((skill) =>
      myInterests.some(
        (mySkill) =>
          mySkill.toLowerCase() === skill.toLowerCase()
      )
    );

    const totalUniqueInterests = new Set([
      ...myInterests.map((skill) => skill.toLowerCase()),
      ...skills.map((skill) => skill.toLowerCase()),
    ]).size;

    if (totalUniqueInterests === 0) {
      return 0;
    }

    return Math.round(
      (common.length / totalUniqueInterests) * 100
    );
  };

  return (
    <section className="discover">
      <MorphicBackground ballColor="#eb3370" />

      {/* ================================
          HEADING
      ================================= */}

      <div className="discover-heading">

        <div className="badge">
          ✦ DISCOVER
        </div>

        <h2>
          Find your
          <span> SkillMates.</span>
        </h2>

        <p>
          People who share your interests and passions.
        </p>

      </div>

      {/* ================================
          LOADING
      ================================= */}

      {loading && (
        <p className="discover-message">
          Finding your SkillMates...
        </p>
      )}

      {/* ================================
          ERROR
      ================================= */}

      {error && (
        <p className="discover-message error">
          {error}
        </p>
      )}

      {/* ================================
          SKILLMATE SLIDER
      ================================= */}

      {!loading && !error && users.length > 0 && (

        <div className="people-slider-wrapper">

          {/* LEFT */}

          <button
            className="slider-arrow slider-left"
            onClick={() => {
              document
                .querySelector(".people-grid")
                ?.scrollBy({
                  left: -350,
                  behavior: "smooth",
                });
            }}
          >
            ←
          </button>

          {/* USERS */}

          <div className="people-grid">

            {users.map((user) => {

              const percentage =
                getCommonGround(user.skills || []);

              return (
                <div
                  className="person-card"
                  key={user.id}
                >

                  {/* Avatar */}

               {/* Avatar */}

{/* Avatar */}

<div className="person-avatar">
  {user.profile_picture ? (
    <img
      src={`${API_URL}${user.profile_picture}`}
      alt={user.name}
    />
  ) : (
    <span>👤</span>
  )}
</div>
                  {/* Info */}

                  <div className="person-info">

                    <div className="person-name-row">

                      <h3>
                        {user.name}
                      </h3>

                      <div className="match-score">
                        {percentage}%
                      </div>

                    </div>

                    <p className="person-bio">
                      {user.bio || "No bio yet."}
                    </p>

                    <div className="person-interests">

                      {user.skills?.slice(0, 3).map(
                        (skill, index) => (
                          <span key={index}>
                            {skill}
                          </span>
                        )
                      )}

                    </div>

                    <button
                      className="connect-button"
                      onClick={() =>
                        onViewProfile(user.id)
                      }
                    >
                      View Profile →
                    </button>

                  </div>

                </div>
              );
            })}

          </div>

          {/* RIGHT */}

          <button
            className="slider-arrow slider-right"
            onClick={() => {
              document
                .querySelector(".people-grid")
                ?.scrollBy({
                  left: 350,
                  behavior: "smooth",
                });
            }}
          >
            →
          </button>

        </div>
      )}

      {/* ================================
          VIEW ALL BUTTON
      ================================= */}

      {!loading && !error && users.length > 0 && (

        <div className="view-all-container">

          <button
            className="view-all-button"
            onClick={onViewAll}
          >
            View All SkillMates →
          </button>

        </div>

      )}

    </section>
  );
}

export default Discover;