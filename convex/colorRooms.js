import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const COLORS = [
  "RED",
  "BLUE",
  "GREEN",
  "YELLOW",
  "ORANGE",
  "PURPLE",
  "PINK",
];

const GAME_DURATION = 60 * 1000;

/* =========================
   GENERATE UPLOAD URL
========================= */

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/* =========================
   CREATE ROOM
========================= */

export const createRoom = mutation({
  args: {
    playerName: v.string(),
  },

  handler: async (ctx, args) => {
    let roomCode = "";

    // Make sure room code is unique
    while (!roomCode) {
      const candidate = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

      const existingRoom = await ctx.db
        .query("colorRooms")
        .withIndex("by_roomCode", (q) =>
          q.eq("roomCode", candidate)
        )
        .first();

      if (!existingRoom) {
        roomCode = candidate;
      }
    }

    const targetColor =
      COLORS[Math.floor(Math.random() * COLORS.length)];

    const roomId = await ctx.db.insert("colorRooms", {
      roomCode,
      playerA: args.playerName,
      playerB: null,

      status: "waiting",

      targetColor,

      photosA: [],
      photosB: [],

      scoreA: 0,
      scoreB: 0,

      createdAt: Date.now(),
    });

    return {
      roomId,
      roomCode,
      targetColor,
    };
  },
});

/* =========================
   JOIN ROOM
========================= */

export const joinRoom = mutation({
  args: {
    roomCode: v.string(),
    playerName: v.string(),
  },

  handler: async (ctx, args) => {
    const code = args.roomCode.trim().toUpperCase();

    const room = await ctx.db
      .query("colorRooms")
      .withIndex("by_roomCode", (q) =>
        q.eq("roomCode", code)
      )
      .unique();

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.playerB) {
      throw new Error("Room is already full");
    }

    if (room.status !== "waiting") {
      throw new Error("This room is no longer accepting players");
    }

    await ctx.db.patch(room._id, {
      playerB: args.playerName,
      status: "ready",
    });

    return {
      roomId: room._id,
      roomCode: room.roomCode,
      targetColor: room.targetColor,
    };
  },
});

/* =========================
   GET ROOM
========================= */

export const getRoom = query({
  args: {
    roomId: v.id("colorRooms"),
  },

  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);

    if (!room) {
      return null;
    }

    const getPhotoUrls = async (photos = []) => {
      const result = [];

      for (const storageId of photos) {
        if (!storageId || typeof storageId !== "string") {
          continue;
        }

        // Ignore old blob URLs / old JSON photo objects
        if (
          storageId.startsWith("blob:") ||
          storageId.startsWith("{")
        ) {
          continue;
        }

        try {
          const url = await ctx.storage.getUrl(storageId);

          if (url) {
            result.push({
              id: storageId,
              url,
            });
          }
        } catch (error) {
          console.error(
            "Failed to get photo URL:",
            error
          );
        }
      }

      return result;
    };

    const photosA = await getPhotoUrls(
      room.photosA || []
    );

    const photosB = await getPhotoUrls(
      room.photosB || []
    );

    return {
      ...room,
      photosA,
      photosB,
    };
  },
});

/* =========================
   START GAME
========================= */

export const startGame = mutation({
  args: {
    roomId: v.id("colorRooms"),
  },

  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    if (!room.playerB) {
      throw new Error("Waiting for Player B");
    }

    if (room.status !== "ready") {
      throw new Error("Room is not ready");
    }

    const now = Date.now();
    const endsAt = now + GAME_DURATION;

    await ctx.db.patch(args.roomId, {
      status: "playing",

      startedAt: now,
      endsAt,

      // Reset game data
      photosA: [],
      photosB: [],

      scoreA: 0,
      scoreB: 0,
    });

    return {
      success: true,
      startedAt: now,
      endsAt,
    };
  },
});

/* =========================
   ADD PHOTO
========================= */

export const addPhoto = mutation({
  args: {
    roomId: v.id("colorRooms"),

    player: v.union(
      v.literal("A"),
      v.literal("B")
    ),

    storageId: v.string(),
  },

  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status !== "playing") {
      throw new Error("Game is not active");
    }

    // Shared server-side timer check
    if (
      room.endsAt &&
      Date.now() >= room.endsAt
    ) {
      await ctx.db.patch(args.roomId, {
        status: "finished",
      });

      throw new Error("Game time is over");
    }

    if (args.player === "A") {
      const photos = room.photosA || [];

      await ctx.db.patch(args.roomId, {
        photosA: [
          ...photos,
          args.storageId,
        ],

        scoreA: room.scoreA + 10,
      });
    } else {
      const photos = room.photosB || [];

      await ctx.db.patch(args.roomId, {
        photosB: [
          ...photos,
          args.storageId,
        ],

        scoreB: room.scoreB + 10,
      });
    }

    return {
      success: true,
      storageId: args.storageId,
    };
  },
});

/* =========================
   DELETE PHOTO
========================= */

export const deletePhoto = mutation({
  args: {
    roomId: v.id("colorRooms"),

    player: v.union(
      v.literal("A"),
      v.literal("B")
    ),

    photoId: v.string(),
  },

  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    if (args.player === "A") {
      const photos = room.photosA || [];

      const updatedPhotos = photos.filter(
        (storageId) =>
          storageId !== args.photoId
      );

      if (updatedPhotos.length === photos.length) {
        throw new Error("Photo not found");
      }

      await ctx.db.patch(args.roomId, {
        photosA: updatedPhotos,

        scoreA: Math.max(
          0,
          room.scoreA - 10
        ),
      });
    } else {
      const photos = room.photosB || [];

      const updatedPhotos = photos.filter(
        (storageId) =>
          storageId !== args.photoId
      );

      if (updatedPhotos.length === photos.length) {
        throw new Error("Photo not found");
      }

      await ctx.db.patch(args.roomId, {
        photosB: updatedPhotos,

        scoreB: Math.max(
          0,
          room.scoreB - 10
        ),
      });
    }

    return {
      success: true,
    };
  },
});

/* =========================
   FINISH GAME
========================= */

export const finishGame = mutation({
  args: {
    roomId: v.id("colorRooms"),
  },

  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status === "playing") {
      await ctx.db.patch(args.roomId, {
        status: "finished",
      });
    }

    return {
      success: true,
    };
  },
});