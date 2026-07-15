/**
 * app/api/health/route.ts
 * --------------------------------------------------------------------------
 * Health check for the frontend's own Next.js server (not the backend API
 * it calls) - used by Kubernetes liveness/readiness probes. The frontend
 * has no external dependency of its own (Mongo/Redis calls all happen
 * browser-side against the backend), so there's nothing to check beyond
 * "can this server process handle a request at all."
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, data: { status: 'ok' } });
}
