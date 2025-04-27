// app/api/get-availability/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);

    const username = searchParams.get("username");
    const eventTypeSlug = searchParams.get("eventTypeSlug") || "15min"; // Default if not provided
    const timeZone = searchParams.get("timeZone") || "Asia/Calcutta";
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    if (!username || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required parameters (username, startTime, endTime)" },
        { status: 400 }
      );
    }

    // Build payload
    const payload = {
      json: {
        isTeamEvent: false,
        usernameList: [username],
        eventTypeSlug: eventTypeSlug,
        startTime: startTime,
        endTime: endTime,
        timeZone: timeZone,
        duration: null,
        rescheduleUid: null,
        orgSlug: null,
        teamMemberEmail: null,
        routedTeamMemberIds: null,
        skipContactOwner: false,
        shouldServeCache: null,
        routingFormResponseId: null,
        email: null,
      },
      meta: {
        values: {
          duration: ["undefined"],
          orgSlug: ["undefined"],
          teamMemberEmail: ["undefined"],
          shouldServeCache: ["undefined"],
          routingFormResponseId: ["undefined"],
        },
      },
    };

    // Encode payload
    const inputParam = encodeURIComponent(JSON.stringify(payload));

    const calcomUrl = `https://cal.com/api/trpc/slots/getSchedule?input=${inputParam}`;

    // Forward the request to Cal.com
    const calcomResponse = await fetch(calcomUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!calcomResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch schedule from Cal.com" },
        { status: calcomResponse.status }
      );
    }

    const data = await calcomResponse.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
