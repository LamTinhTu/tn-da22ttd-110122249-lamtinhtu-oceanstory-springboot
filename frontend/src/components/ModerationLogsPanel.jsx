import { useEffect, useMemo, useState } from 'react';
import {
  adminGetAuditLogDetail,
  adminGetModerationActionDetail,
  adminListAuditLogs,
  adminListModerationActions
} from '../services/adminService';

function formatDateTimeVi(isoLike) {
  if (!isoLike) return '—';
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN');
}

function safeJsonPretty(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function DetailModal({ open, title, data, loading, error, onClose }) {
  if (!open) return null;

  const entries = data && typeof data === 'object' ? Object.entries(data) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-soft">
        <div className="flex items-start justify-between gap-3 border-b border-pink-50 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <div className="mt-1 text-xs text-slate-500">Dữ liệu lấy trực tiếp từ database.</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">Đang tải chi tiết…</div>
          ) : error ? (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">Không có dữ liệu.</div>
          ) : (
            <div className="space-y-3">
              {entries.map(([k, v]) => {
                const key = String(k);
                const isJsonLike = key === 'detail' || key === 'meta';
                const rendered = isJsonLike ? safeJsonPretty(v) : String(v ?? '');
                return (
                  <div key={key} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key}</div>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-800">{rendered || '—'}</pre>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-pink-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ModerationLogsPanel({ token }) {
  const [activeTab, setActiveTab] = useState('audit'); // audit | moderation

  const [draft, setDraft] = useState({ action: '', admin: '', fromDate: '', toDate: '' });
  const [filters, setFilters] = useState({ action: '', admin: '', fromDate: '', toDate: '' });

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });

  const [detail, setDetail] = useState({ open: false, loading: false, error: '', title: '', data: null, type: null, id: null });

  const canPrev = page > 0;
  const canNext = page + 1 < (data?.totalPages || 0);

  const title = useMemo(() => (activeTab === 'audit' ? 'audit_logs' : 'moderation_actions'), [activeTab]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const params = {
          token,
          page,
          size,
          action: filters.action || undefined,
          admin: filters.admin || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined
        };

        const resp =
          activeTab === 'audit' ? await adminListAuditLogs(params) : await adminListModerationActions(params);

        if (!alive) return;
        setData(resp && typeof resp === 'object' ? resp : { content: [], page: 0, size, totalElements: 0, totalPages: 0 });
      } catch (e) {
        if (!alive) return;
        setData({ content: [], page: 0, size, totalElements: 0, totalPages: 0 });
        setError('Không tải được nhật ký. Vui lòng thử lại.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (!token) return;
    load();

    return () => {
      alive = false;
    };
  }, [token, activeTab, page, size, filters]);

  async function openDetail(row) {
    const id = row?.id;
    if (!id) return;

    setDetail({ open: true, loading: true, error: '', title: `Chi tiết (${title}) #${id}`, data: null, type: activeTab, id });

    try {
      const resp =
        activeTab === 'audit'
          ? await adminGetAuditLogDetail({ token, id })
          : await adminGetModerationActionDetail({ token, id });
      setDetail((prev) => ({ ...prev, loading: false, data: resp }));
    } catch {
      setDetail((prev) => ({ ...prev, loading: false, error: 'Không tải được chi tiết.' }));
    }
  }

  function applyFilters() {
    setFilters({
      action: String(draft.action || '').trim(),
      admin: String(draft.admin || '').trim(),
      fromDate: String(draft.fromDate || '').trim(),
      toDate: String(draft.toDate || '').trim()
    });
    setPage(0);
  }

  function clearFilters() {
    const empty = { action: '', admin: '', fromDate: '', toDate: '' };
    setDraft(empty);
    setFilters(empty);
    setPage(0);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">Nhật ký kiểm duyệt</div>
            <div className="mt-1 text-xs text-slate-500">Hiển thị từ 2 bảng: audit_logs & moderation_actions (REAL DB).</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('audit');
                setPage(0);
              }}
              className={
                activeTab === 'audit'
                  ? 'h-10 rounded-xl bg-pink-500 px-4 text-sm font-semibold text-white hover:bg-pink-600'
                  : 'h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50'
              }
            >
              audit_logs
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('moderation');
                setPage(0);
              }}
              className={
                activeTab === 'moderation'
                  ? 'h-10 rounded-xl bg-pink-500 px-4 text-sm font-semibold text-white hover:bg-pink-600'
                  : 'h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50'
              }
            >
              moderation_actions
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid gap-3 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="text-xs font-semibold text-slate-600">Action</div>
            <input
              value={draft.action}
              onChange={(e) => setDraft((p) => ({ ...p, action: e.target.value }))}
              placeholder="VD: CATEGORY_UPDATE"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <div className="lg:col-span-1">
            <div className="text-xs font-semibold text-slate-600">Admin/Moderator</div>
            <input
              value={draft.admin}
              onChange={(e) => setDraft((p) => ({ ...p, admin: e.target.value }))}
              placeholder="username hoặc ID"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <div className="lg:col-span-1">
            <div className="text-xs font-semibold text-slate-600">Từ ngày</div>
            <input
              type="date"
              value={draft.fromDate}
              onChange={(e) => setDraft((p) => ({ ...p, fromDate: e.target.value }))}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <div className="lg:col-span-1">
            <div className="text-xs font-semibold text-slate-600">Đến ngày</div>
            <input
              type="date"
              value={draft.toDate}
              onChange={(e) => setDraft((p) => ({ ...p, toDate: e.target.value }))}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <div className="lg:col-span-1 flex items-end gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="h-11 flex-1 rounded-xl bg-pink-500 px-4 text-sm font-semibold text-white hover:bg-pink-600"
            >
              Lọc
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1100px] w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Action</th>
                {activeTab === 'audit' ? (
                  <>
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">IP</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Moderator</th>
                    <th className="px-4 py-3">Lý do</th>
                  </>
                )}
                <th className="px-4 py-3">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'audit' ? 7 : 7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Đang tải dữ liệu…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={activeTab === 'audit' ? 7 : 7} className="px-4 py-10 text-center text-sm text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : (data?.content || []).length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'audit' ? 7 : 7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Không có bản ghi.
                  </td>
                </tr>
              ) : (
                (data?.content || []).map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 text-sm">
                    <td className="px-4 py-3 text-slate-600">{formatDateTimeVi(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{row.action || '—'}</div>
                    </td>

                    {activeTab === 'audit' ? (
                      <>
                        <td className="px-4 py-3 text-slate-700">{row.actorUsername || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{row.actorRole || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.entityType ? `${row.entityType}${row.entityId ? ` #${row.entityId}` : ''}` : row.entityId ? `#${row.entityId}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.ipAddress || '—'}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-slate-600">
                          {row.targetType ? `${row.targetType} #${row.targetId}` : `#${row.targetId}`}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="text-xs">{row.fromStatus || '—'} → {row.toStatus || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{row.moderatorUsername || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="max-w-[280px] truncate text-xs">{row.reason || '—'}</div>
                        </td>
                      </>
                    )}

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openDetail(row)}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            Tổng: <span className="font-semibold text-slate-700">{data?.totalElements || 0}</span> bản ghi
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={String(size)}
              onChange={(e) => {
                setSize(Number(e.target.value) || 20);
                setPage(0);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={String(n)}>
                  {n}/trang
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!canPrev}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Trước
            </button>
            <div className="text-sm font-semibold text-slate-700">
              Trang {Math.min((data?.page || 0) + 1, data?.totalPages || 1)}/{data?.totalPages || 1}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      <DetailModal
        open={detail.open}
        title={detail.title}
        data={detail.data}
        loading={detail.loading}
        error={detail.error}
        onClose={() => setDetail((p) => ({ ...p, open: false }))}
      />
    </div>
  );
}
