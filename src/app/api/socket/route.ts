import { NextResponse } from "next/server";
import { initSocketServer, NextApiResponseServerIO } from "@/lib/socket";

export async function GET(req: Request, res: NextApiResponseServerIO) {
  try {
    initSocketServer(res);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Socket initialization error:", error);
    return NextResponse.json(
      { error: "Failed to start socket server" },
      { status: 500 }
    );
  }
}
