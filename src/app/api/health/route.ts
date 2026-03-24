import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  await prisma.user.count()

  return NextResponse.json({
    ok: true,
    message: 'Database connected successfully',
  })
}