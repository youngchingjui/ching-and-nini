import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

// GET /api/date-ideas - list date ideas with pagination
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const ideasPerPage = 8;
  const offset = (page - 1) * ideasPerPage;

  // Fetch paginated ideas along with like count and whether the current user liked the idea
  const ideas = await prisma.dateIdea.findMany({
    skip: offset,
    take: ideasPerPage,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { likes: true } },
      likes: session?.user ? { where: { userId: session.user.id }, select: { id: true } } : false,
      createdBy: { select: { name: true } },
    },
  });

  const formattedIdeas = ideas.map((idea) => ({
    id: idea.id,
    title: idea.title,
    description: idea.description,
    image: idea.image,
    createdAt: idea.createdAt,
    createdByName: idea.createdBy?.name ?? "Anonymous",
    likeCount: (idea as any)._count.likes as number,
    likedByMe: idea.likes && idea.likes.length > 0,
  }));

  const totalIdeas = await prisma.dateIdea.count();
  const totalPages = Math.ceil(totalIdeas / ideasPerPage);

  return NextResponse.json({ ideas: formattedIdeas, totalPages });
}

// POST /api/date-ideas - create a new date idea
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, image } = body;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const newIdea = await prisma.dateIdea.create({
    data: {
      title,
      description: description ?? null,
      image: image ?? null,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(newIdea, { status: 201 });
}

