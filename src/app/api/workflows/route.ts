import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflows = await prisma.workflow.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
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
  return NextResponse.json({ workflows });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim().slice(0, 80) : "Untitled Workflow";
  const nodes = Array.isArray(body?.nodes) ? body.nodes : [];
  const edges = Array.isArray(body?.edges) ? body.edges : [];
  const sourceCode = typeof body?.sourceCode === "string" ? body.sourceCode : null;
  const healthScore = Number.isFinite(body?.healthScore) ? Math.max(0, Math.min(100, Math.round(body.healthScore))) : null;
  const latencyScore = Number.isFinite(body?.latencyScore)
    ? Math.max(0, Math.min(100, Math.round(body.latencyScore)))
    : null;

  const workflow = await prisma.workflow.create({
    data: {
      userId: session.user.id,
      name,
      nodesJson: JSON.stringify(nodes),
      edgesJson: JSON.stringify(edges),
      sourceCode,
      nodeCount: nodes.length,
      healthScore,
      latencyScore,
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

  return NextResponse.json({ workflow }, { status: 201 });
}
