import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

async function requireOwnedWorkflow(id: string, userId: string) {
  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow || workflow.userId !== userId) return null;
  return workflow;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflow = await requireOwnedWorkflow(params.id, session.user.id);
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    workflow: {
      id: workflow.id,
      name: workflow.name,
      nodes: JSON.parse(workflow.nodesJson),
      edges: JSON.parse(workflow.edgesJson),
      sourceCode: workflow.sourceCode,
      nodeCount: workflow.nodeCount,
      healthScore: workflow.healthScore,
      latencyScore: workflow.latencyScore,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    },
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await requireOwnedWorkflow(params.id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const data: {
    name?: string;
    nodesJson?: string;
    edgesJson?: string;
    sourceCode?: string | null;
    nodeCount?: number;
    healthScore?: number | null;
    latencyScore?: number | null;
  } = {};

  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim().slice(0, 80);
  if (Array.isArray(body?.nodes)) {
    data.nodesJson = JSON.stringify(body.nodes);
    data.nodeCount = body.nodes.length;
  }
  if (Array.isArray(body?.edges)) data.edgesJson = JSON.stringify(body.edges);
  if (typeof body?.sourceCode === "string") data.sourceCode = body.sourceCode;
  if (Number.isFinite(body?.healthScore)) data.healthScore = Math.max(0, Math.min(100, Math.round(body.healthScore)));
  if (Number.isFinite(body?.latencyScore))
    data.latencyScore = Math.max(0, Math.min(100, Math.round(body.latencyScore)));

  const workflow = await prisma.workflow.update({
    where: { id: params.id },
    data,
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

  return NextResponse.json({ workflow });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await requireOwnedWorkflow(params.id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.workflow.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
