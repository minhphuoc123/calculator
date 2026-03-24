import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chưa đăng nhập',
        },
        { status: 401 }
      )
    }

    const payload = await verifySession(token)

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Người dùng không tồn tại',
        },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tài khoản đã bị khóa',
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Lấy thông tin người dùng thành công',
        data: user,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      },
      { status: 401 }
    )
  }
}