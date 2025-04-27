import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";

/**
 * API route to fetch and process Cal.com profile data
 * GET /api/profile/[username]
 *
 * @param request The incoming request
 * @param params Contains route parameters
 * @returns Processed profile data from Cal.com as JSON
 */
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    console.log(`Fetching profile for username: ${username}`);

    // Fetch the profile page
    const response = await fetch(`https://cal.com/${username}`);
    console.log(`Cal.com response status: ${response.status}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch data for ${username}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    console.log(`Received HTML content length: ${html.length}`);

    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Extract __NEXT_DATA__ JSON
      const nextDataElement = document.getElementById("__NEXT_DATA__");
      if (!nextDataElement?.textContent) {
        console.log("No __NEXT_DATA__ element found in the HTML");

        // Fallback to meta tags as a backup method
        const title = document.querySelector("title")?.textContent || "";
        const profileName = title.replace("| Cal.com", "").trim();

        const bioTag = document.querySelector('meta[name="description"]');
        const bio = bioTag ? bioTag.getAttribute("content") || "" : "";

        const imageTag = document.querySelector('meta[property="og:image"]');
        const imageUrl = imageTag ? imageTag.getAttribute("content") || "" : "";

        return NextResponse.json({
          name: profileName,
          username: username,
          image: imageUrl,
          bio: [bio],
          socials: [],
        });
      }

      console.log("__NEXT_DATA__ element found, parsing JSON");
      const nextDataJson = JSON.parse(nextDataElement.textContent);
      const pageProps = nextDataJson?.props?.pageProps;

      if (!pageProps) {
        console.log("No pageProps found in __NEXT_DATA__");
        return NextResponse.json(
          { error: `Missing pageProps data for ${username}` },
          { status: 404 }
        );
      }

      const profile = pageProps.profile;
      console.log("Profile data:", profile ? "Found" : "Not found");

      if (!profile) {
        return NextResponse.json(
          { error: `Profile data missing for ${username}` },
          { status: 404 }
        );
      }

      // Extract safeBio if available
      let bio: string[] = [];
      if (pageProps.safeBio) {
        try {
          const safeBioDom = new JSDOM(pageProps.safeBio);
          const bioElements = Array.from(
            safeBioDom.window.document.body.children
          );

          for (let i = 0; i < bioElements.length; i++) {
            const el = bioElements[i];
            if (el.textContent?.trim()) {
              bio.push(el.textContent.trim());
            }
          }
        } catch (e) {
          console.error("Error parsing safeBio:", e);
          // If parsing fails, try to get bio from meta description
          const bioTag = document.querySelector('meta[name="description"]');
          if (bioTag && bioTag.getAttribute("content")) {
            bio = [bioTag.getAttribute("content") || ""];
          }
        }
      }

      // Build final clean data object
      const data = {
        name: profile.name || "",
        username: profile.username || username,
        image: profile.avatar || profile.image || "",
        bio: bio,
        socials: pageProps.integrations || [],
      };

      // Ensure image URL is absolute
      if (data.image && !data.image.startsWith("http")) {
        if (data.image.startsWith("/")) {
          data.image = `https://cal.com${data.image}`;
        } else {
          data.image = `https://cal.com/${data.image}`;
        }
      }

      // If no image was found, try to generate a default avatar URL
      if (!data.image) {
        data.image = `https://cal.com/api/avatar/${username}`;
      }

      console.log("Final data being returned:", data);
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error parsing HTML:", error);
      return NextResponse.json(
        {
          error: "Failed to parse HTML response",
          details: String(error),
          username: username,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Top-level error:", error);
    return NextResponse.json(
      {
        error: "Failed to process Cal.com profile",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
