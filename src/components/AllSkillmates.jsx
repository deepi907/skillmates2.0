import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;
function AllSkillMates({ onViewProfile, onBack }) {
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
    <section className="all-skillmates-page">

      {/* ================================
          HEADER
      ================================= */}

      <div className="all-skillmates-header">

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="badge">
          ✦ SKILLMATES
        </div>

        <h1>
          All your
          <span> SkillMates.</span>
        </h1>

        <p>
          Explore everyone who shares your interests,
          hobbies and passions.
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
          USERS
      ================================= */}

      {!loading && !error && (

        <div className="all-people-grid">

          {users.length === 0 ? (

            <p className="discover-message">
              No SkillMates found yet.
            </p>

          ) : (

            users.map((user) => {

              const percentage =
                getCommonGround(user.skills || []);

              return (

                <div
                  className="all-person-card"
                  key={user.id}
                >

                  {/* Avatar */}

                {/* Avatar */}

<div className="all-person-avatar">
  {user.profile_picture ? (
    <img
      src={`${API_URL}${user.profile_picture}`}
      alt={user.name}
    />
  ) : (
    <span>👤</span>
  )}
</div>

                  {/* Information */}

                  <div className="all-person-info">

                    <div className="all-person-name-row">

                      <h3>
                        {user.name}
                      </h3>

                      <div className="all-match-score">
                        {percentage}%
                      </div>

                    </div>

                    {/* Bio */}

                    <p className="all-person-bio">
                      {user.bio || "No bio yet."}
                    </p>

                    {/* Skills */}

                    <div className="all-person-interests">

                      {user.skills?.map(
                        (skill, index) => (
                          <span key={index}>
                            {skill}
                          </span>
                        )
                      )}

                    </div>

                    {/* View Profile */}

                    <button
                      className="all-view-profile-button"
                      onClick={() =>
                        onViewProfile(user.id)
                      }
                    >
                      View Profile →
                    </button>

                  </div>

                </div>

              );
            })

          )}

        </div>

      )}

    </section>
  );
}

export default AllSkillMates;