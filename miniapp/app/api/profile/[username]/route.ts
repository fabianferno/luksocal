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

        // Extract and process image from og:image meta tag
        const imageTag = document.querySelector('meta[property="og:image"]');
        let imageUrl = "";

        if (imageTag) {
          const ogImageUrl = imageTag.getAttribute("content") || "";
          console.log("Original og:image URL:", ogImageUrl);

          // Look specifically for the avatar URL pattern in meetingImage parameter
          if (ogImageUrl.includes("meetingImage=")) {
            try {
              // Try to extract directly from the og:image URL first
              const avatarId = extractAvatarId(ogImageUrl);
              if (avatarId) {
                imageUrl = `https://cal.com/api/avatar/${avatarId}.png`;
                console.log("Extracted avatar ID directly:", avatarId);
              } else {
                // Extract the meetingImage parameter for further processing
                const meetingImageMatch =
                  ogImageUrl.match(/meetingImage=([^&]+)/);
                if (meetingImageMatch && meetingImageMatch[1]) {
                  // First level decode
                  let decoded = decodeURIComponent(meetingImageMatch[1]);
                  console.log("Decoded meetingImage:", decoded);

                  // If it still contains encoded characters, decode again
                  if (decoded.includes("%")) {
                    decoded = decodeURIComponent(decoded);
                    console.log("Second level decode:", decoded);
                  }

                  // Try to extract avatar ID from the decoded URL
                  const avatarIdFromDecoded = extractAvatarId(decoded);
                  if (avatarIdFromDecoded) {
                    imageUrl = `https://cal.com/api/avatar/${avatarIdFromDecoded}.png`;
                    console.log(
                      "Extracted avatar ID from decoded URL:",
                      avatarIdFromDecoded
                    );
                  } else if (decoded.startsWith("http")) {
                    // Or just use the decoded URL if it's valid
                    imageUrl = decoded;
                    console.log("Using decoded URL:", imageUrl);
                  }
                }
              }
            } catch (e) {
              console.error("Error decoding meetingImage from og:image:", e);
            }
          } else {
            // If no meetingImage parameter, use the og:image directly
            imageUrl = ogImageUrl;
          }
        }

        // If we still have no image, use default avatar
        if (!imageUrl) {
          imageUrl = `https://cal.com/api/avatar/${username}`;
          console.log("Using default avatar URL:", imageUrl);
        }

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

      // If no image was found in the profile object, try to extract from og:image
      if (!data.image) {
        const imageTag = document.querySelector('meta[property="og:image"]');

        if (imageTag) {
          const ogImageUrl = imageTag.getAttribute("content") || "";
          console.log("Trying to extract from og:image URL:", ogImageUrl);

          // Try to extract directly from the og:image URL first
          const avatarId = extractAvatarId(ogImageUrl);
          if (avatarId) {
            data.image = `https://cal.com/api/avatar/${avatarId}.png`;
            console.log("Extracted avatar ID directly:", avatarId);
          } else if (ogImageUrl.includes("meetingImage=")) {
            try {
              // Extract the meetingImage parameter for further processing
              const meetingImageMatch =
                ogImageUrl.match(/meetingImage=([^&]+)/);
              if (meetingImageMatch && meetingImageMatch[1]) {
                // First level decode
                let decoded = decodeURIComponent(meetingImageMatch[1]);
                console.log("Decoded meetingImage:", decoded);

                // If it still contains encoded characters, decode again
                if (decoded.includes("%")) {
                  decoded = decodeURIComponent(decoded);
                  console.log("Second level decode:", decoded);
                }

                // Try to extract avatar ID from the decoded URL
                const avatarIdFromDecoded = extractAvatarId(decoded);
                if (avatarIdFromDecoded) {
                  data.image = `https://cal.com/api/avatar/${avatarIdFromDecoded}.png`;
                  console.log(
                    "Extracted avatar ID from decoded URL:",
                    avatarIdFromDecoded
                  );
                } else if (decoded.startsWith("http")) {
                  // Or just use the decoded URL if it's valid
                  data.image = decoded;
                  console.log("Using decoded URL:", data.image);
                }
              }
            } catch (e) {
              console.error("Error decoding meetingImage from og:image:", e);
            }
          } else {
            // If no meetingImage parameter, use the og:image directly
            data.image = ogImageUrl;
          }
        }
      }

      // If we still have no image, use default avatar
      if (!data.image) {
        data.image = `https://cal.com/api/avatar/${username}`;
        console.log("Using default avatar URL:", data.image);
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
  } catch (e) {
    console.error("Error extracting avatar ID:", e);
    return null;
  }
}
