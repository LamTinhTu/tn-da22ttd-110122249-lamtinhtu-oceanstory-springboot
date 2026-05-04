import React, { useState } from 'react'
import { createStory } from '../services/storyService'

const GENRES = [
  'Ngôn tình',
  'Kiếm hiệp',
  'Fantasy',
  'Khoa học viễn tưởng',
  'Tiểu sử/Lịch sử',
  'Horror',
  'Hài hước',
  'Thơ',
  'Truyện ngắn',
  'Huyền bí',
  'Phiêu lưu',
  'Trinh thám',
  'Tâm lý',
  'Giáo dục'
]

const TOPICS = [
  'Tình cảm',
  'Hành động',
  'Kỳ ảo',
  'Hài hước',
  'Tâm lý',
  'Xã hội',
  'Gia đình',
  'Bạn bè',
  'Học đường',
  'Công việc'
]

export default function CreateStory() {
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username')
  
  const [form, setForm] = useState({
    type: '',
    title: '',
    coAuthor: '',
    description: '', // Tóm tắt nội dung
    genres: '',      // Dropdown single value
    topics: ''       // Dropdown single value
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.type.trim()) e.type = 'Loại hình là bắt buộc'
    if (!form.title.trim()) e.title = 'Tên tác phẩm là bắt buộc'
    if (!form.description.trim()) e.description = 'Tóm tắt nội dung là bắt buộc'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setMsg('')
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    setLoading(true)
    try {
      const payload = { ...form }
      await createStory(payload, token)
      setMsg('Gửi tác phẩm kiểm duyệt thành công. Admin sẽ duyệt trong 24-48 giờ.')
      setForm({ type: '', title: '', coAuthor: '', description: '', genres: '', topics: '' })
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Lỗi khi gửi tác phẩm')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-card">
      <h3 className="create-title">📝 Gửi tác phẩm kiểm duyệt</h3>
      <form onSubmit={handleSubmit} className="create-form">
        <div>
          <label className="label">Loại hình <span className="required">*</span></label>
          <select name="type" value={form.type} onChange={handleChange} className="spec-select">
            <option value="">-- Chọn --</option>
            <option value="Một chương">Một chương</option>
            <option value="Nhiều chương">Nhiều chương</option>
          </select>
          {errors.type && <div className="error">{errors.type}</div>}
        </div>

        <div>
          <label className="label">Tên tác phẩm <span className="required">*</span></label>
          <input name="title" value={form.title} onChange={handleChange} placeholder="Nhập tên tác phẩm" className="spec-input" />
          {errors.title && <div className="error">{errors.title}</div>}
        </div>

        <div>
          <label className="label">Tác giả</label>
          <input type="text" value={username} disabled className="spec-input" style={{ backgroundColor: '#f9f9f9', color: '#666' }} />
        </div>

        <div>
          <label className="label">Đồng tác giả</label>
          <input name="coAuthor" value={form.coAuthor} onChange={handleChange} placeholder="(Tuỳ chọn)" className="spec-input" />
        </div>

        <div>
          <label className="label">Tóm tắt nội dung <span className="required">*</span></label>
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Mô tả tóm tắt nội dung truyện" className="spec-textarea" rows={5} />
          {errors.description && <div className="error">{errors.description}</div>}
        </div>

        <div className="grid-2">
          <div>
            <label className="label">Thể loại</label>
            <select name="genres" value={form.genres} onChange={handleChange} className="spec-select">
              <option value="">-- Chọn thể loại --</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Chủ đề</label>
            <select name="topics" value={form.topics} onChange={handleChange} className="spec-select">
              <option value="">-- Chọn chủ đề --</option>
              {TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="submit-row">
          <button type="submit" disabled={loading} className="spec-btn">
            {loading ? '⏳ Đang gửi...' : '✨ Gửi kiểm duyệt'}
          </button>
        </div>
      </form>
      {msg && <div className={`message ${msg.includes('thành công') ? '' : 'error'}`}>{msg}</div>}
    </div>
  )
}
