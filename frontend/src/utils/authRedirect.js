export function getRedirectPathByRole(role) {
  const normalizedRole = String(role || '').toUpperCase().trim();

  if (normalizedRole === 'ADMIN') return '/admin/dashboard';
  if (normalizedRole === 'MODERATOR') return '/moderator/dashboard';

  return '/my-stories';
}
