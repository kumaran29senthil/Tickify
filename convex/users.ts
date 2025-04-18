import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get Razorpay Contact ID
export const getUsersRazorpayContactId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.neq(q.field("razorpayContactId"), undefined))
      .first();
    return user?.razorpayContactId;
  },
});

// Mutation to update or create Razorpay Contact ID
export const updateOrCreateUserRazorpayContactId = mutation({
  args: { userId: v.string(), razorpayContactId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { razorpayContactId: args.razorpayContactId });
  },
});

// ✅ Mutation to update Razorpay Account ID (sub-account for Connect)
export const updateUserRazorpayAccountId = mutation({
  args: { userId: v.string(), razorpayAccountId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { razorpayAccountId: args.razorpayAccountId });
  },
});

// ✅ Query to get Razorpay Account ID
export const getUsersRazorpayAccountId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    return user?.razorpayAccountId ?? null;
  },
});

// Update or create user data (name, email)
export const updateUser = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { userId, name, email }) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name,
        email,
      });
      return existingUser._id;
    }

    const newUserId = await ctx.db.insert("users", {
      userId,
      name,
      email,
      razorpayContactId: undefined,
      razorpayAccountId: undefined,
    });

    return newUserId;
  },
});

// Get user by userId
export const getUserById = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    return user;
  },
});
