import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const original = await prisma.workflow.findUnique({ where: { id: params.id } });
  if (!original || original.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const copy = await prisma.workflow.create({
    data: {
      userId: session.user.id,
      name: `${original.name} (copy)`.slice(0, 80),
      nodesJson: original.nodesJson,
      edgesJson: original.edgesJson,
      sourceCode: original.sourceCode,
      nodeCount: original.nodeCount,
      healthScore: original.healthScore,
      latencyScore: original.latencyScore,
    },
    select: {
      id: true,
      name: true,
      nodeCount: true,
      healthScore: true,
      latencyScore: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ workflow: copy }, { status: 201 });
}
