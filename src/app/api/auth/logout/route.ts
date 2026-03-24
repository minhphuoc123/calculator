import { NextResponse } from 'next/server'

export async function POST() {
    const response = NextResponse.json(
        {
            success: true,
            message: 'Đăng xuất thành công',
        },
        { status: 200 }
    )

    response.cookies.set({
        name: 'session_token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(0),
    })

    return response
}