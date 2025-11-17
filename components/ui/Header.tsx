import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import NavItems from '../NavItems'
import UserDropdown from '../UserDropdown'

const Header = ({user}:{user:User}) => {
    return (
        <header className='sticky top-0 z-50 header'>
            <div className='header-wrapper container'>
                <Link href='/'>

                    <Image src='assets/icons/logo.svg' alt='StockAI Logo' width={140} height={32} className="h-8 w-auto cursor-pointer" />
                </Link>
                <nav className='hidden sm:block'>
                    <NavItems/>
                </nav>
                <UserDropdown user={user}/>
            </div>
        </header>
    )
}

export default Header