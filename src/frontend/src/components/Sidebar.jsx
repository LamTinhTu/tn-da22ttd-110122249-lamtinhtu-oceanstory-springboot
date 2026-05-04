import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  const items = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'account', label: 'Tài khoản' },
    { key: 'stories', label: 'Tác phẩm' },
    { key: 'review', label: 'Review / Fanfic' },
    { key: 'withdraw', label: 'Rút mật' }
  ]

  return (
    <aside className="app-sidebar">
      <div className="sidebar-inner">
        <div className="sidebar-logo">Văn phòng</div>
        <nav className="sidebar-nav">
          {items.map((it) => (
            <NavLink
              key={it.key}
              to="#"
              className={({ isActive }) => `sidebar-item ${it.key === 'stories' ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{it.label.charAt(0)}</span>
              <span className="sidebar-label">{it.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}
