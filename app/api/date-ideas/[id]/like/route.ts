import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

interface Params {
  params: {
    id: string;
  };
}

// POST /api/date-ideas/[id]/like - toggle like for current user
export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ideaId = parseInt(params.id, 10);
  if (isNaN(ideaId)) {
    return NextResponse.json({ error: "Invalid idea id" }, { status: 400 });
  }

  // Check if like already exists
  const existingLike = await prisma.ideaLike.findUnique({
    where: {
      userId_ideaId: {
        userId: session.user.id,
        ideaId,
      },
    },
  });

  if (existingLike) {
    // Remove like (unlike)
    await prisma.ideaLike.delete({
      where: { id: existingLike.id },
    });
    return NextResponse.json({ liked: false });
  }

  // Add like
  await prisma.ideaLike.create({
    data: {
      userId: session.user.id,
      ideaId,
    },
  });
  return NextResponse.json({ liked: true });
}

