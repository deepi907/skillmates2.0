import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
const chaosChallenges = [
  "Draw a cat using your other hand",
  "Draw an alien chef",
  "Draw a dinosaur eating pizza",
  "Draw your dream house",
  "Draw a robot using only circles",
  "Draw an imaginary animal",
  "Draw yourself as a superhero",
  "Draw a spaceship",
  "Draw your favorite food",
  "Draw a funny face",
];
export const createRoom = mutation({
  args: {
    playerName: v.string(),
  },

  handler: async (ctx, args) => {
    const roomCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
 const challenge =
  chaosChallenges[
    Math.floor(Math.random() * chaosChallenges.length)
  ];
 const roomId = await ctx.db.insert("chaosRooms", {
  roomCode,
  playerA: args.playerName,
  playerB: null,
  status: "waiting",

    
  challenge,
  drawingA: null,
  drawingB: null,

  submittedA: false,
  submittedB: false,

  createdAt: Date.now(),
});

    return {
      roomId,
      roomCode,
      challenge,
    };
  },
});

export const joinRoom = mutation({
  args: {
    roomCode: v.string(),
    playerName: v.string(),
  },

  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("chaosRooms")
      .withIndex("by_roomCode", (q) =>
        q.eq("roomCode", args.roomCode.toUpperCase())
      )
      .unique();

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.playerB) {
      throw new Error("Room is already full");
    }

    await ctx.db.patch(room._id, {
      playerB: args.playerName,
      status: "ready",
    });

    return {
      roomId: room._id,
      roomCode: room.roomCode,
    };
  },
});

// ==========================================
// GET ROOM — REAL-TIME
// ==========================================

export const getRoom = query({
  args: {
    roomId: v.id("chaosRooms"),
  },

  handler: async (ctx, args) => {
    return await ctx.db.get(args.roomId);
  },
});

export const startGame = mutation({
  args: {
    roomId: v.id("chaosRooms"),
  },

  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    if (!room.playerB) {
      throw new Error("Waiting for Player B");
    }

    const gameStartedAt = Date.now();

    await ctx.db.patch(args.roomId, {
      status: "playing",
      gameStartedAt,
      gameDuration: 60,
    });

    return {
      success: true,
      gameStartedAt,
      gameDuration: 60,
    };
  },
});

// ==========================================
// UPDATE DRAWING — REAL-TIME
// ==========================================

export const updateDrawing = mutation({
  args: {
    roomId: v.id("chaosRooms"),
    player: v.union(
      v.literal("A"),
      v.literal("B")
    ),
    drawing: v.string(),
  },

  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    if (args.player === "A") {
      await ctx.db.patch(args.roomId, {
        drawingA: args.drawing,
      });
    } else {
      await ctx.db.patch(args.roomId, {
        drawingB: args.drawing,
      });
    }

    return {
      success: true,
    };
  },
});

// ==========================================
// SUBMIT DRAWING
// ==========================================

export const submitDrawing = mutation({
  args: {
    roomId: v.id("chaosRooms"),
    player: v.union(
      v.literal("A"),
      v.literal("B")
    ),
  },

  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    if (args.player === "A") {
      await ctx.db.patch(args.roomId, {
        submittedA: true,
      });
    } else {
      await ctx.db.patch(args.roomId, {
        submittedB: true,
      });
    }

    return {
      success: true,
    };
  },
});