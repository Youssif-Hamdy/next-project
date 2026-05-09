import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

const IMAGE_PATH =
  "C:/Users/NEW LAP/.cursor/projects/d-nextjs-project-ecommerce-app/assets/c__Users_NEW_LAP_AppData_Roaming_Cursor_User_workspaceStorage_e09ca25457af174f13deb1648243e19c_images_R__1_-a90fafbd-3cc9-4f16-9273-5a45a3102bed.png";

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
    return NextResponse.json({ message: "Products background image not found." }, { status: 404 });
  }
}
