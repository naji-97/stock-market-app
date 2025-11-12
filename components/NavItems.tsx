'use client'

import { NAV_ITEMS } from '@/lib/constant'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const NavItems = () => {
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/'
        }
        return pathname.startsWith(href)
    }

    return (
        <ul className='flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium'>{
            NAV_ITEMS.map((item) => (
                <li key={item.href}>
                    <Link href={item.href} className={`hover:text-yellow-500 transitions-colors ${isActive(item.href) ? 'text-gray-100' : ''}`}>{item.label} </Link>
                </li>
            ))
        }</ul>
    )
}

export default NavItems