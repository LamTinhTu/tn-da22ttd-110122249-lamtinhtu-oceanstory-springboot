import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import CreateStory from '../components/CreateStory'
import AuthModal from '../components/AuthModal'

export default function UploadStory() {
  const navigate = useNavigate()
  const justAuthenticatedRef = useRef(false)
  const [authState, setAuthState] = useState(() => ({
    token: localStorage.getItem('token'),
    username: localStorage.getItem('username')
  }))
  const [authMode, setAuthMode] = useState('login')

  // Cập nhật authOpen dựa trên token
  const isLoggedIn = Boolean(authState.token)

  // Theo dõi thay đổi token khi người dùng đăng nhập thành công
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token')
      const newUsername = localStorage.getItem('username')
      setAuthState({ token: newToken, username: newUsername })
    }

    // Lắng nghe sự kiện storage change (khi tab khác thay đổi auth state)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const handleAuthSuccess = ({ token, username }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('username', username)
    setAuthState({ token, username })
    justAuthenticatedRef.current = true
  }

  const handleModalClose = () => {
    // Nếu vừa đăng nhập thành công, không navigate, hiển thị form viết
    if (justAuthenticatedRef.current) {
      justAuthenticatedRef.current = false
      return
    }
    // Nếu user cancel modal thì về home
    navigate('/home')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setAuthState({ token: null, username: null })
    navigate('/home')
  }

  // Nếu chưa đăng nhập, hiện modal auth
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar
          isLoggedIn={false}
          onSearch={() => {}}
          onSelectCategory={() => {}}
        />
        <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
          <AuthModal
            isOpen={true}
            mode={authMode}
            onClose={handleModalClose}
            onAuthSuccess={handleAuthSuccess}
          />
        </div>
      </div>
    )
  }

  // Nếu đã đăng nhập, hiện giao diện viết (layout đồng bộ với các trang khác)
  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-50 via-pink-50 to-white">
      <Navbar
        isLoggedIn={true}
        username={authState.username}
        onLogout={handleLogout}
        onSearch={() => {}}
        onSelectCategory={() => {}}
      />
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1">
            <CreateStory />
          </main>
        </div>
      </div>
    </div>
  )
}
