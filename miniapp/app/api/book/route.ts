// app/api/book-call/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, email, startTime, eventTypeSlug, user, timeZone, notes } =
      body;

    if (!name || !email || !startTime || !eventTypeSlug || !user || !timeZone) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, email, startTime, eventTypeSlug, user, timeZone",
        },
        { status: 400 }
      );
    }

    // Fetch the eventId from the eventTypeSlug
    const eventId = await fetchEventId(user, eventTypeSlug);
    console.log("eventId", eventId);

    const calcomUrl = "https://cal.com/api/book/event";

    const payload = {
      responses: {
        name: name,
        email: email,
        notes: notes,
        location: { value: "integrations:daily", optionValue: "" },
        guests: [],
      },
      user: user,
      start: startTime,
      timeZone: timeZone,
      eventTypeId: eventId,
      language: "en",
      metadata: {},
      hasHashedBookingLink: false,
    };

    const calcomResponse = await fetch(calcomUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!calcomResponse.ok) {
      const errorText = await calcomResponse.text();
      return NextResponse.json(
        { error: "Failed to book event with Cal.com", details: errorText },
        { status: calcomResponse.status }
      );
    }

    const data = await calcomResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error booking call:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

async function fetchEventId(username: string, eventTypeSlug: string) {
  const url = `https://cal.com/api/trpc/public/event?batch=1&input={"0":{"json":{"username":"${username}","eventSlug":"${eventTypeSlug}","isTeamEvent":false,"org":null}}}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (data[0].result.data.json.id) {
      return data[0].result.data.json.id;
      // biome-ignore lint/style/noUselessElse: <explanation>
    } else {
      throw new Error("Invalid response format or missing id");
    }
  } catch (error) {
    console.error("Error fetching event data:", error);
    throw error;
  }
}
