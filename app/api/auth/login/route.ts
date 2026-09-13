import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { setSession } from '@/lib/auth/session'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    const validUsername = process.env.APP_USERNAME
    const validPasswordHash = process.env.APP_PASSWORD_HASH

    if (!validUsername || !validPasswordHash) {
      return NextResponse.json(
        { error: 'خطأ في إعدادات الخادم' },
        { status: 500 }
      )
    }

    if (username !== validUsername) {
      return NextResponse.json(
        { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    const isPasswordValid = await compare(password, validPasswordHash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    await setSession(username)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الدخول' },
      { status: 500 }
    )
  }
}
