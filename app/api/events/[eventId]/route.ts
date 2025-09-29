import { hasPermission, PERMISSIONS } from "@/app/lib/permissions";
import { prisma } from "@/app/lib/prisma";
import { updateEventSchema } from "@/app/lib/validation";
import { NextRequest, NextResponse } from "next/server";

// GET /api/events/[eventId] - Get event details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const event = await prisma.calendarEvent.findUnique({
      where: { id: parseInt(eventId) },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        eventType: true,
        createdAt: true,
        attendance: {
          select: {
            id: true,
            status: true,
            checkInAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    console.error("Get event details error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/events/[eventId] - Update event
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permission
    const canManage = await hasPermission(
      parseInt(userId),
      PERMISSIONS.MANAGE_EVENTS
    );

    if (!canManage) {
      return NextResponse.json(
        { error: "Permission denied: manage_events required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateEventSchema.parse(body);

    // Check if event exists
    const event = await prisma.calendarEvent.findUnique({
      where: { id: parseInt(eventId) },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Validate dates if both are provided
    if (validatedData.startDate && validatedData.endDate) {
      if (new Date(validatedData.startDate) > new Date(validatedData.endDate)) {
        return NextResponse.json(
          { error: "Start date must be before end date" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.startDate)
      updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate)
      updateData.endDate = new Date(validatedData.endDate);
    if (validatedData.location !== undefined)
      updateData.location = validatedData.location;
    if (validatedData.eventType) updateData.eventType = validatedData.eventType;

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: parseInt(eventId) },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        eventType: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update event error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[eventId] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const eventId = (await params).eventId;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permission
    const canManage = await hasPermission(
      parseInt(userId),
      PERMISSIONS.MANAGE_EVENTS
    );

    if (!canManage) {
      return NextResponse.json(
        { error: "Permission denied: manage_events required" },
        { status: 403 }
      );
    }

    // Check if event exists
    const event = await prisma.calendarEvent.findUnique({
      where: { id: parseInt(eventId) },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Delete event (attendance records will be cascade deleted)
    await prisma.calendarEvent.delete({
      where: { id: parseInt(eventId) },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    console.error("Delete event error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
