import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;
function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(
        `${API_URL}/api/users`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch members");
        }

        const data = await response.json();

        setMembers(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error("Members error:", err);
        setError("Could not load members.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (loading) {
    return <h2>Loading members...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  return (
    <div>
      <h1>Members</h1>

      <p>
        Total members: {members.length}
      </p>

      {members.map((member) => (
        <div
          key={member.id}
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "15px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {member.name}
          </h2>

          <p>
            <strong>Email:</strong>{" "}
            {member.email}
          </p>

          <p>
            <strong>Bio:</strong>{" "}
            {member.bio || "No bio added"}
          </p>

          <p>
            <strong>Skills:</strong>{" "}
            {Array.isArray(member.skills) &&
            member.skills.length > 0
              ? member.skills.join(", ")
              : "No skills added"}
          </p>

          <p>
            <strong>Learning:</strong>{" "}
            {Array.isArray(member.learning) &&
            member.learning.length > 0
              ? member.learning.join(", ")
              : "No learning interests added"}
          </p>

          <p>
            <strong>Joined:</strong>{" "}
            {member.created_at
              ? new Date(
                  member.created_at
                ).toLocaleDateString()
              : "Unknown"}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Members;