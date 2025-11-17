import React from 'react'
import Header from '@/components/ui/Header'
import { auth } from '@/lib/better-auth/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
type Props = {
    children: React.ReactNode
}
const layout = async({children}: Props) => {
  const session =await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) redirect('/sign-in')
  const user = {
    id:session.user.id,
    name:session.user.name,
    email: session.user.email
  }
  return (
    <main className='min-h-screen text-gray-400'>

        <Header user={user} />
        <div className='container py-10'>{children}</div>
    </main>
  )
}

export default layout