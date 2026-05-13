import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Slider from '../components/Slider';
import StoryCard from '../components/StoryCard';
import { fetchExploreStories, searchStories } from '../services/homeService';
import { logout } from '../services/authService';

const banners = [
  {
    id: 1,
    title: 'Mùa Hè Có Em',
    subtitle: 'Ngôn tình chữa lành được yêu thích tuần này',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 2,
    title: 'Thanh Kiếm Cuối Cùng',
    subtitle: 'Kiếm hiệp pha fantasy, cốt truyện cuốn hút',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 3,
    title: 'Dư Âm Học Đường',
    subtitle: 'Tuổi trẻ, âm nhạc và những rung động đầu đời',
    image: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=1200&q=80'
  }
];

const tabs = [
  { key: 'updated', label: 'Vừa cập nhật' },
  { key: 'new', label: 'Tác phẩm mới' },
  { key: 'recommended', label: 'Đề xuất' }
];

export default function Home() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState(() => ({
    token: localStorage.getItem('token'),
    username: localStorage.getItem('username')
  }));
  const isLoggedIn = Boolean(authState.token);

  const [activeTab, setActiveTab] = useState('updated');
  const [category, setCategory] = useState('');
  const [stories, setStories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const listTitle = useMemo(() => {
    if (searchKeyword) {
      return `Kết quả tìm kiếm cho: "${searchKeyword}"`;
    }
    if (category) {
      return `Kết quả theo thể loại: ${category}`;
    }
    return 'Khám phá tác phẩm';
  }, [category, searchKeyword]);

  useEffect(() => {
    const loadStories = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchExploreStories(activeTab, category);
        setStories(Array.isArray(data) ? data : []);
      } catch (error) {
        setStories([]);
        setError('Không tải được danh sách truyện. Vui lòng kiểm tra kết nối backend.');
      } finally {
        setLoading(false);
      }
    };

    if (!searchKeyword) {
      loadStories();
    }
  }, [activeTab, category, searchKeyword]);

  const handleSearch = async (keyword) => {
    if (!keyword) {
      setSearchKeyword('');
      setSearchResults([]);
      setError('');
      return;
    }

    setSearchKeyword(keyword);
    setLoading(true);
    setError('');
    try {
      const data = await searchStories(keyword);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      setSearchResults([]);
      setError('Không tìm kiếm được. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (authState.token) {
        await logout(authState.token);
      }
    } catch (error) {
      // Neu logout API loi thi van clear phien o frontend.
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      setAuthState({ token: null, username: '' });
      navigate('/home');
    }
  };

  const handleAuthSuccess = ({ token, username }) => {
    setAuthState({ token, username: username || '' });
  };

  const displayStories = searchKeyword ? searchResults : stories;
  const shouldShowSlider = !searchKeyword && !category;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-50 via-pink-50 to-white text-slate-800">
      <Navbar
        isLoggedIn={isLoggedIn}
        username={authState.username}
        onLogout={handleLogout}
        onAuthSuccess={handleAuthSuccess}
        onSearch={handleSearch}
        onSelectCategory={(selected) => {
          setSearchKeyword('');
          setCategory(selected);
        }}
      />

      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 md:px-6">
        {shouldShowSlider && <Slider banners={banners} />}

        <section className="rounded-2xl bg-white/80 p-5 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-slate-800">{listTitle}</h2>
            {!searchKeyword && (
              <div className="flex items-center gap-2 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeTab === tab.key
                        ? 'bg-pink-400 text-white shadow'
                        : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {category && !searchKeyword && (
            <p className="mb-4 text-sm text-slate-500">Đang lọc theo thể loại: <strong>{category}</strong></p>
          )}

          {error && (
            <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </p>
          )}

          {loading ? (
            <p className="py-8 text-center text-slate-500">Đang tải dữ liệu truyện...</p>
          ) : (
            displayStories.length ? (
              <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
                {displayStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-slate-500">
                {searchKeyword ? 'Không tìm thấy truyện phù hợp.' : 'Chưa có truyện để hiển thị.'}
              </p>
            )
          )}
        </section>
      </main>
    </div>
  );
}
