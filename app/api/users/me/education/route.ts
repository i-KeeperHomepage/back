import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/users/me/education - Get current user's education history
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const educationHistory = await prisma.educationHistory.findMany({
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

    return NextResponse.json(educationHistory);
  } catch (error) {
    console.error("Error fetching user education history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
