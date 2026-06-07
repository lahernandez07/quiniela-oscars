import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    "worldcup2026-group-stage.json"
  );

  const file = fs.readFileSync(filePath, "utf8");
  const matches = JSON.parse(file);

  return NextResponse.json(matches);
}