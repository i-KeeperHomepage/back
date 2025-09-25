import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/users/me/awards - Get current user's awards
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const awards = await prisma.award.findMany({
      where: { userId: parseInt(userId) },
      include: {
        evidenceFile: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimetype: true,
            path: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(awards);
  } catch (error) {
    console.error("Error fetching user awards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
