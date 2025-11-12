import React from 'react'
import Header from '@/components/ui/Header'
type Props = {
    children: React.ReactNode
}
const layout = ({children}: Props) => {
  return (
    <main className='min-h-screen text-gray-400'>

        <Header />
        <div className='container py-10'>{children}</div>
    </main>
  )
}

export default layout