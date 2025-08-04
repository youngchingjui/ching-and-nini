import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

// GET /api/date-ideas/matches - ideas liked by current user AND at least one other user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // First, find idea ids liked by current user
  const likedIdeaIds = await prisma.ideaLike.findMany({
    where: { userId: session.user.id },
    select: { ideaId: true },
  });

  const ids = likedIdeaIds.map((l) => l.ideaId);
  if (ids.length === 0) return NextResponse.json({ matches: [] });

  // Fetch ideas where other users also liked
  const matches = await prisma.dateIdea.findMany({
    where: {
      id: { in: ids },
      likes: {
        some: {
          userId: { not: session.user.id },
        },
      },
    },
    include: {
      _count: { select: { likes: true } },
      createdBy: { select: { name: true } },
    },
  });

  const formatted = matches.map((idea) => ({
    id: idea.id,
    title: idea.title,
    description: idea.description,
    createdAt: idea.createdAt,
    likeCount: (idea as any)._count.likes as number,
    createdByName: idea.createdBy?.name ?? "Anonymous",
  }));

  return NextResponse.json({ matches: formatted });
}

