import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

function Dashboard({ stats }) {
  const cards = [
    {
      title: "Total Users",
      value: stats?.users ?? 0,
      subtitle: "Registered SkillMates",
      icon: "👥",
    },
    {
      title: "Total Members",
      value: stats?.members ?? 0,
      subtitle: "Active profiles",
      icon: "👤",
    },
    {
      title: "Total Matches",
      value: stats?.matches ?? 0,
      subtitle: "Accepted connections",
      icon: "❤️",
    },
    {
      title: "Total Messages",
      value: stats?.messages ?? 0,
      subtitle: "Stored conversations",
      icon: "💬",
    },
  ];

  return (
    <Box>
      {/* HEADER */}

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ mb: 1 }}
        >
          Dashboard
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Overview of your SkillMates platform
        </Typography>
      </Box>

      {/* STAT CARDS */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(4, 1fr)",
          },
          gap: 3,
          mb: 3,
        }}
      >
        {cards.map((card) => (
          <Card
            key={card.title}
            elevation={0}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 3,
              backgroundColor: "#ffffff",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {card.title}
                  </Typography>

                  <Typography
                    variant="h3"
                    fontWeight={700}
                  >
                    {card.value}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      mt: 1,
                    }}
                  >
                    {card.subtitle}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2,
                    backgroundColor: "#eaf2ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* LOWER AREA */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "2fr 1fr",
          },
          gap: 3,
        }}
      >
        {/* OVERVIEW */}

        <Card
          elevation={0}
          sx={{
            minHeight: 320,
            border: "1px solid #e5e7eb",
            borderRadius: 3,
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              fontWeight={600}
            >
              SkillMates Overview
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Current platform statistics
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mt: 3,
              }}
            >
              <OverviewItem
                label="Users"
                value={stats?.users ?? 0}
              />

              <OverviewItem
                label="Members"
                value={stats?.members ?? 0}
              />

              <OverviewItem
                label="Matches"
                value={stats?.matches ?? 0}
              />

              <OverviewItem
                label="Messages"
                value={stats?.messages ?? 0}
              />
            </Box>
          </CardContent>
        </Card>

        {/* ACTIVITY */}

        <Card
          elevation={0}
          sx={{
            minHeight: 320,
            border: "1px solid #e5e7eb",
            borderRadius: 3,
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              fontWeight={600}
            >
              Platform Activity
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Current SkillMates activity
            </Typography>

            <Box sx={{ mt: 2 }}>
              <ActivityRow
                icon="👥"
                text={`${stats?.users ?? 0} registered users`}
              />

              <ActivityRow
                icon="👤"
                text={`${stats?.members ?? 0} member profiles`}
              />

              <ActivityRow
                icon="❤️"
                text={`${stats?.matches ?? 0} accepted matches`}
              />

              <ActivityRow
                icon="💬"
                text={`${stats?.messages ?? 0} stored messages`}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function OverviewItem({ label, value }) {
  return (
    <Box
      sx={{
        backgroundColor: "#f8fafc",
        borderRadius: 2,
        p: 2,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {label}
      </Typography>

      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ mt: 0.5 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function ActivityRow({ icon, text }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1.5,
        borderBottom: "1px solid #f0f2f5",
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          backgroundColor: "#f3f6fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Typography variant="body2">
        {text}
      </Typography>
    </Box>
  );
}

export default Dashboard;