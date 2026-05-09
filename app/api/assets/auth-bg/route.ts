import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

const IMAGE_PATH =
  "C:/Users/NEW LAP/.cursor/projects/d-nextjs-project-ecommerce-app/assets/c__Users_NEW_LAP_AppData_Roaming_Cursor_User_workspaceStorage_e09ca25457af174f13deb1648243e19c_images_bshopify.png.3840x1950_q85_upscale-cd64671f-ed0f-4be1-b8d8-52a39e9e2d93.png";

export async function GET() {
  try {
    const imageBuffer = await readFile(IMAGE_PATH);
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ message: "Background image not found." }, { status: 404 });
  }
}
