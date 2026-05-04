import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import '../styles/admin.css'

const API_BASE = 'http://localhost:8080/api'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username')
  
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [selectedStory, setSelectedStory] = useState(null)
  const [reviewForm, setReviewForm] = useState({ approvalStatus: '', adminNotes: '' })

  // Kiểm tra quyền admin
  useEffect(() => {
    if (!token) {
      navigate('/login')
    }
  }, [token, navigate])

  // Load pending stories
  useEffect(() => {
    if (!token) return
    
    const fetchPendingStories = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_BASE}/stories/admin/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setStories(response.data)
        setMsg('')
      } catch (err) {
        setMsg(err?.response?.data?.message || 'Lỗi khi tải danh sách chờ duyệt')
      } finally {
        setLoading(false)
      }
    }

    fetchPendingStories()
  }, [token])

  const handleReview = (story) => {
    setSelectedStory(story)
    setReviewForm({ approvalStatus: '', adminNotes: '' })
  }

  const handleSubmitReview = async () => {
    if (!reviewForm.approvalStatus) {
      alert('Vui lòng chọn quyết định (Phê duyệt/Từ chối)')
      return
    }

    try {
      const response = await axios.put(
        `${API_BASE}/stories/${selectedStory.id}/review`,
        reviewForm,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Update UI
      setStories(stories.filter(s => s.id !== selectedStory.id))
      setSelectedStory(null)
      setMsg(`✅ Đã ${reviewForm.approvalStatus === 'APPROVED' ? 'phê duyệt' : 'từ chối'} truyện "${selectedStory.title}"`)
      
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Lỗi khi duyệt truyện')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-50 via-pink-50 to-white">
      <Navbar
        isLoggedIn={true}
        username={username}
        onLogout={handleLogout}
        onSearch={() => {}}
        onSelectCategory={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="admin-title">🎯 Bảng điều khiển duyệt tác phẩm</h1>

        {msg && <div className={`message ${msg.includes('Lỗi') ? 'error' : ''}`}>{msg}</div>}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Đang tải...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">✨ Không có truyện chờ duyệt</p>
          </div>
        ) : (
          <div className="pending-stories">
            {stories.map((story) => (
              <div key={story.id} className="story-card">
                <div className="story-header">
                  <h3 className="story-title">{story.title}</h3>
                  <span className="story-type">{story.type}</span>
                </div>

                <div className="story-meta">
                  <p><strong>📝 Tác giả:</strong> {story.authorName}</p>
                  {story.coAuthor && <p><strong>✍️ Đồng tác giả:</strong> {story.coAuthor}</p>}
                  <p><strong>📋 Thể loại:</strong> {story.genres || 'N/A'}</p>
                  <p><strong>🏷️ Chủ đề:</strong> {story.topics || 'N/A'}</p>
                </div>

                <div className="story-description">
                  <p><strong>📖 Tóm tắt:</strong></p>
                  <p className="description-text">{story.description}</p>
                </div>

                <div className="story-dates">
                  <small>Gửi lúc: {new Date(story.createdAt).toLocaleString('vi-VN')}</small>
                </div>

                {selectedStory?.id !== story.id ? (
                  <button className="review-btn" onClick={() => handleReview(story)}>
                    👀 Xem & Duyệt
                  </button>
                ) : (
                  <div className="review-form">
                    <div>
                      <label>Quyết định duyệt:</label>
                      <select
                        value={reviewForm.approvalStatus}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, approvalStatus: e.target.value })
                        }
                        className="spec-select"
                      >
                        <option value="">-- Chọn --</option>
                        <option value="APPROVED">✅ Phê duyệt</option>
                        <option value="REJECTED">❌ Từ chối</option>
                      </select>
                    </div>

                    <div>
                      <label>Ghi chú từ admin:</label>
                      <textarea
                        value={reviewForm.adminNotes}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, adminNotes: e.target.value })
                        }
                        placeholder="Để lại ghi chú cho tác giả (nếu cần)"
                        className="spec-textarea"
                        rows={4}
                      />
                    </div>

                    <div className="form-actions">
                      <button
                        className="btn-submit"
                        onClick={handleSubmitReview}
                      >
                        ✨ Xác nhận quyết định
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setSelectedStory(null)}
                      >
                        ✕ Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
