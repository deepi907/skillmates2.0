import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;
function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/matches`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch matches");
        }

        const data = await response.json();
        setMatches(data);
      } catch (err) {
        console.error("Matches error:", err);
        setError("Could not load matches.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return <h2>Loading matches...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  return (
    <div>
      <h1>Matches</h1>

      <p>
        Total accepted matches: {matches.length}
      </p>

      {matches.map((match) => (
        <div
          key={match.id}
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "18px",
            marginBottom: "12px",
          }}
        >
          <strong>
            {match.sender_name} ❤️ {match.receiver_name}
          </strong>

          <p>Status: {match.status}</p>

          <small>
            {match.created_at
              ? new Date(
                  match.created_at
                ).toLocaleString()
              : ""}
          </small>
        </div>
      ))}
    </div>
  );
}

export default Matches;