import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import UploadStory from './pages/UploadStory';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import ModeratorDashboard from './pages/ModeratorDashboard';
import RequireRole from './components/RequireRole';
import MyStories from './pages/MyStories';
import MyStoryDetail from './pages/MyStoryDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/upload-story" element={<UploadStory />} />
      <Route path="/my-stories" element={<MyStories />} />
      <Route path="/my-stories/:id" element={<MyStoryDetail />} />
      <Route
        path="/admin/dashboard"
        element={
          <RequireRole allowedRoles={["ADMIN"]}>
            <AdminDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/admin/stories"
        element={
          <RequireRole allowedRoles={["ADMIN"]}>
            <AdminDashboard initialTab="stories" />
          </RequireRole>
        }
      />
      <Route
        path="/admin/chapters"
        element={
          <RequireRole allowedRoles={["ADMIN"]}>
            <AdminDashboard initialTab="chapters" />
          </RequireRole>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireRole allowedRoles={["ADMIN"]}>
            <AdminDashboard initialTab="users" />
          </RequireRole>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <RequireRole allowedRoles={["ADMIN"]}>
            <AdminDashboard initialTab="logs" />
          </RequireRole>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <RequireRole allowedRoles={["ADMIN"]}>
            <AdminDashboard initialTab="notifications" />
          </RequireRole>
        }
      />
      <Route
        path="/admin/vip"
        element={
          <RequireRole allowedRoles={["ADMIN"]}>
            <AdminDashboard initialTab="vip" />
          </RequireRole>
        }
      />
      <Route
        path="/admin/comments"
        element={
          <RequireRole allowedRoles={["ADMIN"]}>
            <AdminDashboard initialTab="comments" />
          </RequireRole>
        }
      />
      <Route
        path="/admin/tags"
        element={
          <RequireRole allowedRoles={["ADMIN"]}>
            <AdminDashboard initialTab="tags" />
          </RequireRole>
        }
      />
      <Route
        path="/moderator/dashboard"
        element={
          <RequireRole allowedRoles={["MODERATOR"]}>
            <ModeratorDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/moderator/chapters"
        element={
          <RequireRole allowedRoles={["MODERATOR"]}>
            <ModeratorDashboard initialTab="chapters" />
          </RequireRole>
        }
      />
      <Route
        path="/moderator/stories"
        element={
          <RequireRole allowedRoles={["MODERATOR"]}>
            <ModeratorDashboard initialTab="stories" />
          </RequireRole>
        }
      />
      <Route
        path="/moderator/reports"
        element={
          <RequireRole allowedRoles={["MODERATOR"]}>
            <ModeratorDashboard initialTab="reports" />
          </RequireRole>
        }
      />
      <Route
        path="/moderator/comments"
        element={
          <RequireRole allowedRoles={["MODERATOR"]}>
            <ModeratorDashboard initialTab="comments" />
          </RequireRole>
        }
      />
      <Route
        path="/moderator/tags"
        element={
          <RequireRole allowedRoles={["MODERATOR"]}>
            <ModeratorDashboard initialTab="tags" />
          </RequireRole>
        }
      />
      <Route
        path="/moderator/notifications"
        element={
          <RequireRole allowedRoles={["MODERATOR"]}>
            <ModeratorDashboard initialTab="notifications" />
          </RequireRole>
        }
      />
      <Route
        path="/moderator/logs"
        element={
          <RequireRole allowedRoles={["MODERATOR"]}>
            <ModeratorDashboard initialTab="logs" />
          </RequireRole>
        }
      />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
