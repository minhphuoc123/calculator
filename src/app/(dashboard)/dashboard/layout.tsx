import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import { getCurrentUser } from '@/lib/auth'

type Props = {
    children: ReactNode
}

export default async function DashboardLayout({ children }: Props) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    return <>{children}</>
}