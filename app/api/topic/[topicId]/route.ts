import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import db from "@/db/drizzle";
import { topics } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export const GET = async (
  _req: NextRequest,
  { params }: { params: { topicId: number } }
) => {
  const isAdmin = getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const data = await db.query.topics.findFirst({
    where: eq(topics.id, params.topicId),
  });

  return NextResponse.json(data);
};

export const PUT = async (
  req: NextRequest,
  { params }: { params: { topicId: number } }
) => {
  const isAdmin = getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const body = (await req.json()) as typeof topics.$inferSelect;
  const data = await db
    .update(topics)
    .set({
      ...body,
    })
    .where(eq(topics.id, params.topicId))
    .returning();

  return NextResponse.json(data[0]);
};

export const DELETE = async (
  _req: NextRequest,
  { params }: { params: { topicId: number } }
) => {
  const isAdmin = getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const data = await db
    .delete(topics)
    .where(eq(topics.id, params.topicId))
    .returning();

  return NextResponse.json(data[0]);
};
