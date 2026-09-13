import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chaosRooms: defineTable({
    roomCode: v.string(),

    playerA: v.string(),
    playerB: v.union(v.string(), v.null()),

    status: v.string(),
    challenge: v.optional(v.string()),

drawingA: v.optional(v.union(v.string(), v.null())),
drawingB: v.optional(v.union(v.string(), v.null())),

submittedA: v.optional(v.boolean()),
submittedB: v.optional(v.boolean()),

gameStartedAt: v.optional(v.number()),
gameDuration: v.optional(v.number()),

    createdAt: v.number(),
  }).index("by_roomCode", ["roomCode"]),

  colorRooms: defineTable({
  roomCode: v.string(),

  playerA: v.string(),
  playerB: v.union(v.string(), v.null()),

  status: v.string(),

  targetColor: v.string(),

  photosA: v.optional(v.array(v.string())),
  photosB: v.optional(v.array(v.string())),

scoreA: v.number(),
scoreB: v.number(),

startedAt: v.optional(v.number()),
endsAt: v.optional(v.number()),

createdAt: v.number(),
}).index("by_roomCode", ["roomCode"]),
});