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
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const username = url.pathname.split("/").pop(); // brittle and error-prone

    // Fetch the profile page
    const response = await fetch(`https://cal.com/${username}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch data for ${username}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Extract __NEXT_DATA__ JSON
      const nextDataElement = document.getElementById("__NEXT_DATA__");
      if (!nextDataElement?.textContent) {
        // Fallback to meta tags as a backup method
        const title = document.querySelector("title")?.textContent || "";
        const profileName = title.replace("| Cal.com", "").trim();

        const bioTag = document.querySelector('meta[name="description"]');
        const bio = bioTag ? bioTag.getAttribute("content") || "" : "";

        // Extract and process image from og:image meta tag
        const imageTag = document.querySelector('meta[property="og:image"]');
        let imageUrl = "";

        if (imageTag) {
          const ogImageUrl = imageTag.getAttribute("content") || "";

          // Always attempt robust extraction
          let meetingImageValue = "";
          try {
            const ogUrl = new URL(ogImageUrl, "https://cal.com");
            const innerUrlEncoded = ogUrl.searchParams.get("url");
            if (innerUrlEncoded) {
              const innerUrl = decodeURIComponent(innerUrlEncoded);
              // Now extract meetingImage from this inner URL
              const innerParams = new URLSearchParams(innerUrl.split("?")[1]);
              meetingImageValue = innerParams.get("meetingImage") || "";
            }
          } catch (e) {
            console.error(
              "Error extracting meetingImage from nested og:image URL:",
              e
            );
          }
          if (meetingImageValue) {
            // First level decode
            let decoded = decodeURIComponent(meetingImageValue);
            // If it still contains encoded characters, decode again
            if (decoded.includes("%")) {
              decoded = decodeURIComponent(decoded);
            }
            // Try to extract avatar ID from the decoded URL
            const avatarIdFromDecoded = extractAvatarId(decoded);
            if (avatarIdFromDecoded) {
              imageUrl = `https://cal.com/api/avatar/${avatarIdFromDecoded}.png`;
            } else if (decoded.startsWith("http")) {
              // Or just use the decoded URL if it's valid
              imageUrl = decoded;
            }
          }
        }

        // If we still have no image, use default avatar
        if (!imageUrl) {
          imageUrl = `https://cal.com/api/avatar/${username}`;
        }

        return NextResponse.json({
          name: profileName,
          username: username,
          image: imageUrl,
          bio: [bio],
          socials: [],
        });
      }

      const nextDataJson = JSON.parse(nextDataElement.textContent);
      const pageProps = nextDataJson?.props?.pageProps;

      if (!pageProps) {
        return NextResponse.json(
          { error: `Missing pageProps data for ${username}` },
          { status: 404 }
        );
      }

      const profile = pageProps.profile;

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
        } catch {
          console.error("Error parsing safeBio:");
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

      // If no image was found in the profile object, try to extract from og:image
      if (!data.image) {
        const imageTag = document.querySelector('meta[property="og:image"]');

        if (imageTag) {
          const ogImageUrl = imageTag.getAttribute("content") || "";

          // Always attempt robust extraction
          let meetingImageValue = "";
          try {
            const ogUrl = new URL(ogImageUrl, "https://cal.com");
            const innerUrlEncoded = ogUrl.searchParams.get("url");
            if (innerUrlEncoded) {
              const innerUrl = decodeURIComponent(innerUrlEncoded);
              // Now extract meetingImage from this inner URL
              const innerParams = new URLSearchParams(innerUrl.split("?")[1]);
              meetingImageValue = innerParams.get("meetingImage") || "";
            }
          } catch (e) {
            console.error(
              "Error extracting meetingImage from nested og:image URL:",
              e
            );
          }
          if (meetingImageValue) {
            // First level decode
            let decoded = decodeURIComponent(meetingImageValue);
            // If it still contains encoded characters, decode again
            if (decoded.includes("%")) {
              decoded = decodeURIComponent(decoded);
            }
            // Try to extract avatar ID from the decoded URL
            const avatarIdFromDecoded = extractAvatarId(decoded);
            if (avatarIdFromDecoded) {
              data.image = `https://cal.com/api/avatar/${avatarIdFromDecoded}.png`;
            } else if (decoded.startsWith("http")) {
              // Or just use the decoded URL if it's valid
              data.image = decoded;
            }
          }
        }
      }

      // If we still have no image, use default avatar
      if (!data.image) {
        data.image = `https://cal.com/api/avatar/${username}`;
      }

      return NextResponse.json(data);
    } catch (error) {
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
    return NextResponse.json(
      {
        error: "Failed to process Cal.com profile",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Extracts the avatar ID from a Cal.com URL or URL parameter
 * @param url The URL to extract from
 * @returns The avatar ID or null if not found
 */
function extractAvatarId(url: string): string | null {
  try {
    // Try direct avatar pattern first
    const directMatch = url.match(/avatar\/([a-f0-9-]+)\.png/i);
    if (directMatch && directMatch[1]) {
      return directMatch[1];
    }

    // Try encoded avatar pattern
    const encodedMatch = url.match(/avatar%2F([a-f0-9-]+)\.png/i);
    if (encodedMatch && encodedMatch[1]) {
      return encodedMatch[1];
    }

    // Try double encoded avatar pattern
    const doubleEncodedMatch = url.match(/avatar%252F([a-f0-9-]+)\.png/i);
    if (doubleEncodedMatch && doubleEncodedMatch[1]) {
      return doubleEncodedMatch[1];
    }

    return null;
  } catch {
    console.error("Error extracting avatar ID:");
    return null;
  }
}
