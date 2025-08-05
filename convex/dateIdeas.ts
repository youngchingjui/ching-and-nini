import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/*
 Date Ideas CRUD + matching helpers.
 The functions below are consumed from the React app via the
 `convex/react` hooks, e.g. `useMutation(api.dateIdeas.create)`.

 Schema (implicit)
 -----------------
 1. date_ideas
    - _id: Id<"date_ideas">
    - text: string
    - createdBy: string (prisma user id)
    - createdAt: number (ms since epoch)

 2. favorites
    - _id: Id<"favorites">
    - ideaId: Id<"date_ideas">
    - userId: string (prisma user id)
    - createdAt: number
*/

export const create = mutation({
  args: { text: v.string(), userId: v.string() },
  handler: async (ctx, { text, userId }) => {
    const id = await ctx.db.insert("date_ideas", {
      text,
      createdBy: userId,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const list = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, { userId }) => {
    const ideas = await ctx.db.query("date_ideas").order("desc").collect();

    if (!userId) return ideas;

    // Fetch all favorites by the requesting user.
    const favDocs = await ctx.db.query("favorites").collect();
    const favSet = new Set(
      favDocs.filter((f) => f.userId === userId).map((f) => f.ideaId.toString())
    );

    return ideas.map((idea) => ({ ...idea, favorited: favSet.has(idea._id.toString()) }));
  },
});

export const toggleFavorite = mutation({
  args: { ideaId: v.id("date_ideas"), userId: v.string() },
  handler: async (ctx, { ideaId, userId }) => {
    // Check if a favorite already exists
    const existing = await ctx.db
      .query("favorites")
      .collect()
      .then((docs) => docs.find((d) => d.ideaId.equals?.(ideaId) || d.ideaId === ideaId && d.userId === userId));

    if (existing) {
      await ctx.db.delete(existing._id);
      return { status: "removed" as const };
    }

    await ctx.db.insert("favorites", {
      ideaId,
      userId,
      createdAt: Date.now(),
    });
    return { status: "added" as const };
  },
});

export const matches = query({
  args: {},
  handler: async (ctx) => {
    const favorites = await ctx.db.query("favorites").collect();

    // Map ideaId -> Set<userId>
    const map = new Map<string, Set<string>>();
    for (const fav of favorites) {
      const key = fav.ideaId.toString();
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(fav.userId);
    }

    const matchedIds = Array.from(map.entries())
      .filter(([, set]) => set.size >= 2)
      .map(([id]) => id);

    const ideas = await Promise.all(
      matchedIds.map((id) => ctx.db.get(id as any))
    );

    return ideas.filter(Boolean);
  },
});

