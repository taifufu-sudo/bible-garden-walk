// Cloudflare Worker Backend — 聖經大地圖・牧區多人線上版 API (Workers + D1)
// Security: Web Crypto SHA-256 salted PIN hashing, constant-time compare, random session tokens,
// parameterized D1 SQL queries, strict CORS, and privacy-safe group endpoints (phone/PIN never exposed).

const ALLOWED_ORIGINS = [
  'https://taifufu-sudo.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765',
  'http://localhost:3000'
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allow = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.workers.dev') || origin.endsWith('.pages.dev')
    ? origin
    : 'https://taifufu-sudo.github.io';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
  };
}

function jsonResp(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request)
    }
  });
}

function errResp(request, message, status = 400) {
  return jsonResp(request, { ok: false, error: message }, status);
}

// Cryptographic helpers (Workers Best Practices: Web Crypto only, zero Math.random())
function randomHex(byteLen = 24) {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function normalizePhone(raw) {
  return String(raw || '').replace(/[\s\-()]/g, '').trim();
}

function normalizePin(raw) {
  return String(raw || '').replace(/\D/g, '').trim();
}

function taiwanDateISO(d = new Date()) {
  // Asia/Taipei UTC+8
  const tw = new Date(d.getTime() + 8 * 3600 * 1000);
  return tw.toISOString().slice(0, 10);
}

function taiwanWeekKey(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - dow);
  return dt.toISOString().slice(0, 10);
}

async function getAuthUser(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token || token.length < 16) return null;

  const row = await env.DB.prepare(`
    SELECT u.*, g.name AS group_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    JOIN groups g ON g.id = u.group_id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).bind(token).first();
  return row || null;
}

function serializeSelfUser(u) {
  return {
    id: u.id,
    phoneMasked: u.phone.length >= 7 ? `${u.phone.slice(0, 4)}***${u.phone.slice(-3)}` : u.phone,
    nickname: u.nickname,
    groupId: u.group_id,
    groupName: u.group_name,
    role: u.role,
    startDate: u.start_date,
    churchName: u.church_name,
    readChapters: safeParseJSON(u.read_chapters_json, {}),
    graceDays: safeParseJSON(u.grace_days_json, {}),
    gardenItems: safeParseJSON(u.garden_items_json, []),
    pluckedCount: u.plucked_count || 0,
    waterEnergy: u.water_energy || 0,
    versesRead: u.verses_read || 0,
    chaptersRead: u.chapters_read || 0,
    booksCompleted: u.books_completed || 0,
    currentStreak: u.current_streak || 0,
    longestStreak: u.longest_streak || 0,
    lastReadDate: u.last_read_date
  };
}

function safeParseJSON(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

async function createSession(env, userId) {
  const token = `${crypto.randomUUID()}-${randomHex(20)}`;
  // 180-day persistent login so seniors stay logged in effortlessly all season!
  await env.DB.prepare(`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (?, ?, datetime('now', '+180 days'))
  `).bind(token, userId).run();
  return token;
}

async function readBody(request, maxBytes = 250_000) {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error('Payload too large');
  return text ? JSON.parse(text) : {};
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // === PUBLIC ENDPOINTS ===
      if (method === 'GET' && path === '/api/health') {
        const { results } = await env.DB.prepare('SELECT id, name, sort_order FROM groups ORDER BY sort_order ASC, id ASC').all();
        return jsonResp(request, { ok: true, app: 'bible-garden-zone', today: taiwanDateISO(), groups: results });
      }

      if (method === 'GET' && path === '/api/groups') {
        const { results } = await env.DB.prepare('SELECT id, name, sort_order, weekly_target_per_member FROM groups ORDER BY sort_order ASC, id ASC').all();
        return jsonResp(request, { ok: true, groups: results });
      }

      // Check whether phone exists (helps UI seamlessly show Login vs Register)
      if (method === 'POST' && path === '/api/auth/lookup') {
        const body = await readBody(request);
        const phone = normalizePhone(body.phone);
        if (!/^09\d{8}$/.test(phone) && !/^\d{8,12}$/.test(phone)) {
          return errResp(request, '請輸入正確的手機號碼（例如 0912345678）', 400);
        }
        const found = await env.DB.prepare('SELECT id, nickname, group_id FROM users WHERE phone = ?').bind(phone).first();
        return jsonResp(request, { ok: true, exists: Boolean(found), nickname: found?.nickname || null });
      }

      // Unified Login with Phone + 4-digit Birthday (MMDD)
      if (method === 'POST' && path === '/api/auth/login') {
        const body = await readBody(request);
        const phone = normalizePhone(body.phone);
        const pin = normalizePin(body.pin);
        if (!phone || pin.length !== 4) {
          return errResp(request, '請輸入手機號碼與生日四碼（例如 0520）', 400);
        }

        const user = await env.DB.prepare(`
          SELECT u.*, g.name AS group_name
          FROM users u JOIN groups g ON g.id = u.group_id
          WHERE u.phone = ?
        `).bind(phone).first();

        if (!user) {
          return errResp(request, '尚未找到這支手機號碼，請先進行首次註冊', 404);
        }

        const candidateHash = await sha256Hex(`${user.pin_salt}:${pin}`);
        if (!timingSafeEqualHex(candidateHash, user.pin_hash)) {
          return errResp(request, '生日四碼不正確，請再試一次（若忘記可請區長從後台協助重設）', 401);
        }

        await env.DB.prepare("UPDATE users SET last_active_at = datetime('now') WHERE id = ?").bind(user.id).run();
        const token = await createSession(env, user.id);
        return jsonResp(request, { ok: true, token, user: serializeSelfUser(user) });
      }

      // First-Time Registration (Phone + 4-digit Birthday + Nickname + Group + optional solo progress migration!)
      if (method === 'POST' && path === '/api/auth/register') {
        const body = await readBody(request);
        const phone = normalizePhone(body.phone);
        const pin = normalizePin(body.pin);
        const nickname = String(body.nickname || '').trim().slice(0, 20);
        const groupId = Number(body.groupId);
        const startDate = /^\d{4}-\d{2}-\d{2}$/.test(body.startDate || '') ? body.startDate : taiwanDateISO();
        const churchName = String(body.churchName || '安平靈糧堂').trim().slice(0, 24) || '安平靈糧堂';

        if (!/^\d{8,12}$/.test(phone)) return errResp(request, '請輸入有效的手機號碼（8–12 位數字）', 400);
        if (pin.length !== 4) return errResp(request, '請輸入 4 碼生日數字（例如 0520）', 400);
        if (!nickname) return errResp(request, '請輸入您的姓名或暱稱', 400);

        const group = await env.DB.prepare('SELECT id, name FROM groups WHERE id = ?').bind(groupId).first();
        if (!group) return errResp(request, '請選擇您所屬的小組', 400);

        const dup = await env.DB.prepare('SELECT id FROM users WHERE phone = ?').bind(phone).first();
        if (dup) return errResp(request, '這支手機號碼已經註冊過了，請直接登入！', 409);

        const salt = randomHex(16);
        const pinHash = await sha256Hex(`${salt}:${pin}`);

        // Optional migration of existing solo progress
        const mig = body.migrate || {};
        const readChaptersJson = JSON.stringify(mig.readChapters && typeof mig.readChapters === 'object' ? mig.readChapters : {});
        const graceDaysJson = JSON.stringify(mig.graceDays && typeof mig.graceDays === 'object' ? mig.graceDays : {});
        const gardenItemsJson = JSON.stringify(Array.isArray(mig.gardenItems) ? mig.gardenItems.slice(0, 120) : []);
        const pluckedCount = Math.max(0, Number(mig.pluckedCount) || 0);
        const versesRead = Math.max(0, Number(mig.versesRead) || 0);
        const chaptersRead = Math.max(0, Number(mig.chaptersRead) || 0);
        const booksCompleted = Math.max(0, Number(mig.booksCompleted) || 0);
        const currentStreak = Math.max(0, Number(mig.currentStreak) || 0);
        const longestStreak = Math.max(0, Number(mig.longestStreak) || 0);
        const lastReadDate = versesRead > 0 ? taiwanDateISO() : null;

        const inserted = await env.DB.prepare(`
          INSERT INTO users (
            phone, pin_salt, pin_hash, nickname, group_id, role, start_date, church_name,
            read_chapters_json, grace_days_json, garden_items_json, plucked_count,
            verses_read, chapters_read, books_completed, current_streak, longest_streak, last_read_date
          ) VALUES (?, ?, ?, ?, ?, 'member', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `).bind(
          phone, salt, pinHash, nickname, groupId, startDate, churchName,
          readChaptersJson, graceDaysJson, gardenItemsJson, pluckedCount,
          versesRead, chaptersRead, booksCompleted, currentStreak, longestStreak, lastReadDate
        ).first();

        inserted.group_name = group.name;
        const token = await createSession(env, inserted.id);
        return jsonResp(request, { ok: true, token, user: serializeSelfUser(inserted) }, 201);
      }

      // === AUTHENTICATED ENDPOINTS ===
      const me = await getAuthUser(request, env);
      if (!me) return errResp(request, '請先登入牧區帳號', 401);

      if (method === 'POST' && path === '/api/auth/logout') {
        const token = (request.headers.get('Authorization') || '').slice(7).trim();
        await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
        return jsonResp(request, { ok: true });
      }

      // Get latest self state + recent incoming watering/blessing notifications
      if (method === 'GET' && path === '/api/me') {
        const { results: recentInbox } = await env.DB.prepare(`
          SELECT gi.id, gi.kind, gi.message, gi.day_iso, gi.created_at, u.nickname AS from_name
          FROM garden_interactions gi
          JOIN users u ON u.id = gi.from_user_id
          WHERE gi.to_user_id = ?
          ORDER BY gi.id DESC
          LIMIT 15
        `).bind(me.id).all();

        const { results: myJournal } = await env.DB.prepare(`
          SELECT id, date_iso, mood, verse, note, is_shared, created_at
          FROM reflections
          WHERE user_id = ?
          ORDER BY id DESC
          LIMIT 60
        `).bind(me.id).all();

        return jsonResp(request, {
          ok: true,
          user: serializeSelfUser(me),
          inbox: recentInbox,
          journal: myJournal
        });
      }

      // Sync reading chapters, grace days, garden layout, and stats to cloud
      if (method === 'PUT' && path === '/api/me/sync') {
        const body = await readBody(request);
        const readChapters = body.readChapters && typeof body.readChapters === 'object' ? body.readChapters : safeParseJSON(me.read_chapters_json, {});
        const graceDays = body.graceDays && typeof body.graceDays === 'object' ? body.graceDays : safeParseJSON(me.grace_days_json, {});
        const gardenItems = Array.isArray(body.gardenItems) ? body.gardenItems.slice(0, 150) : safeParseJSON(me.garden_items_json, []);
        const pluckedCount = Math.max(0, Number(body.pluckedCount ?? me.plucked_count) || 0);
        const versesRead = Math.max(0, Number(body.versesRead ?? me.verses_read) || 0);
        const chaptersRead = Math.max(0, Number(body.chaptersRead ?? me.chapters_read) || 0);
        const booksCompleted = Math.max(0, Number(body.booksCompleted ?? me.books_completed) || 0);
        const currentStreak = Math.max(0, Number(body.currentStreak ?? me.current_streak) || 0);
        const longestStreak = Math.max(0, Number(body.longestStreak ?? me.longest_streak) || 0);

        const today = taiwanDateISO();
        const deltaVerses = Math.max(0, versesRead - (me.verses_read || 0));
        const lastReadDate = deltaVerses > 0 ? today : (body.lastReadDate || me.last_read_date);

        await env.DB.prepare(`
          UPDATE users SET
            read_chapters_json = ?,
            grace_days_json = ?,
            garden_items_json = ?,
            plucked_count = ?,
            verses_read = ?,
            chapters_read = ?,
            books_completed = ?,
            current_streak = ?,
            longest_streak = ?,
            last_read_date = ?,
            last_active_at = datetime('now')
          WHERE id = ?
        `).bind(
          JSON.stringify(readChapters),
          JSON.stringify(graceDays),
          JSON.stringify(gardenItems),
          pluckedCount,
          versesRead,
          chaptersRead,
          booksCompleted,
          currentStreak,
          longestStreak,
          lastReadDate,
          me.id
        ).run();

        // Accumulate positive new verses into this week's cooperative group log!
        if (deltaVerses > 0) {
          const wk = taiwanWeekKey(today);
          await env.DB.prepare(`
            INSERT INTO weekly_reading_log (user_id, group_id, week_key, verses_delta)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, week_key) DO UPDATE SET
              verses_delta = verses_delta + excluded.verses_delta,
              group_id = excluded.group_id,
              updated_at = datetime('now')
          `).bind(me.id, me.group_id, wk, deltaVerses).run();
        }

        return jsonResp(request, { ok: true, syncedAt: new Date().toISOString() });
      }

      // Update profile (nickname, startDate, churchName, groupId)
      if (method === 'PUT' && path === '/api/me/profile') {
        const body = await readBody(request);
        const nickname = String(body.nickname ?? me.nickname).trim().slice(0, 20) || me.nickname;
        const churchName = String(body.churchName ?? me.church_name).trim().slice(0, 24) || me.church_name;
        const startDate = /^\d{4}-\d{2}-\d{2}$/.test(body.startDate || '') ? body.startDate : me.start_date;
        let groupId = me.group_id;
        if (body.groupId && Number(body.groupId) !== me.group_id) {
          const g = await env.DB.prepare('SELECT id FROM groups WHERE id = ?').bind(Number(body.groupId)).first();
          if (g) groupId = g.id;
        }
        await env.DB.prepare(`
          UPDATE users SET nickname = ?, church_name = ?, start_date = ?, group_id = ?, last_active_at = datetime('now')
          WHERE id = ?
        `).bind(nickname, churchName, startDate, groupId, me.id).run();

        const updated = await env.DB.prepare(`
          SELECT u.*, g.name AS group_name FROM users u JOIN groups g ON g.id = u.group_id WHERE u.id = ?
        `).bind(me.id).first();
        return jsonResp(request, { ok: true, user: serializeSelfUser(updated) });
      }

      // === SMALL GROUP HUB (Visit Gardens, Watering, Blessings, Weekly Goal) ===
      if (method === 'GET' && path === '/api/group/overview') {
        const today = taiwanDateISO();
        const wk = taiwanWeekKey(today);
        // Admin can optionally preview any group via ?groupId=
        const targetGroupId = (me.role === 'admin' && url.searchParams.get('groupId'))
          ? Number(url.searchParams.get('groupId'))
          : me.group_id;

        const group = await env.DB.prepare('SELECT id, name, weekly_target_per_member FROM groups WHERE id = ?').bind(targetGroupId).first();
        if (!group) return errResp(request, '找不到小組', 404);

        const { results: members } = await env.DB.prepare(`
          SELECT id, nickname, verses_read, chapters_read, books_completed, current_streak,
                 last_read_date, garden_items_json, water_energy
          FROM users
          WHERE group_id = ?
          ORDER BY (last_read_date = ?) DESC, current_streak DESC, verses_read DESC
        `).bind(targetGroupId, today).all();

        const { results: wateredToday } = await env.DB.prepare(`
          SELECT to_user_id FROM garden_interactions
          WHERE from_user_id = ? AND kind = 'water' AND day_iso = ?
        `).bind(me.id, today).all();
        const wateredSet = new Set(wateredToday.map(r => r.to_user_id));

        const weeklyRow = await env.DB.prepare(`
          SELECT COALESCE(SUM(verses_delta), 0) AS total_verses
          FROM weekly_reading_log
          WHERE group_id = ? AND week_key = ?
        `).bind(targetGroupId, wk).first();

        const claimRow = await env.DB.prepare(`
          SELECT 1 AS claimed FROM weekly_goal_claims WHERE user_id = ? AND week_key = ?
        `).bind(me.id, wk).first();

        const weeklyTarget = Math.max(1, members.length) * (group.weekly_target_per_member || 350);
        const weeklyVerses = weeklyRow?.total_verses || 0;

        return jsonResp(request, {
          ok: true,
          today,
          weekKey: wk,
          group: {
            id: group.id,
            name: group.name,
            memberCount: members.length,
            weeklyTarget,
            weeklyVerses,
            weeklyPct: Math.min(100, Math.round((weeklyVerses / weeklyTarget) * 100)),
            weeklyGoalReached: weeklyVerses >= weeklyTarget,
            weeklyClaimed: Boolean(claimRow)
          },
          members: members.map(m => ({
            id: m.id,
            nickname: m.nickname,
            isMe: m.id === me.id,
            readToday: m.last_read_date === today,
            versesRead: m.verses_read || 0,
            chaptersRead: m.chapters_read || 0,
            booksCompleted: m.books_completed || 0,
            currentStreak: m.current_streak || 0,
            gardenItemCount: safeParseJSON(m.garden_items_json, []).length,
            wateredByMeToday: wateredSet.has(m.id)
          }))
        });
      }

      // Visit a groupmate's 21:9 living garden
      const visitMatch = path.match(/^\/api\/group\/garden\/(\d+)$/);
      if (method === 'GET' && visitMatch) {
        const targetId = Number(visitMatch[1]);
        const host = await env.DB.prepare(`
          SELECT u.id, u.nickname, u.group_id, g.name AS group_name, u.verses_read,
                 u.chapters_read, u.books_completed, u.current_streak, u.last_read_date,
                 u.garden_items_json, u.water_energy
          FROM users u JOIN groups g ON g.id = u.group_id
          WHERE u.id = ?
        `).bind(targetId).first();
        if (!host) return errResp(request, '找不到這位組員', 404);
        if (host.group_id !== me.group_id && me.role !== 'admin') {
          return errResp(request, '只能拜訪同一小組組員的花園喔', 403);
        }

        const today = taiwanDateISO();
        const watered = await env.DB.prepare(`
          SELECT 1 FROM garden_interactions
          WHERE from_user_id = ? AND to_user_id = ? AND kind = 'water' AND day_iso = ?
        `).bind(me.id, targetId, today).first();

        const { results: guestbook } = await env.DB.prepare(`
          SELECT gi.id, gi.kind, gi.message, gi.day_iso, gi.created_at, u.nickname AS from_name
          FROM garden_interactions gi
          JOIN users u ON u.id = gi.from_user_id
          WHERE gi.to_user_id = ?
          ORDER BY gi.id DESC
          LIMIT 12
        `).bind(targetId).all();

        return jsonResp(request, {
          ok: true,
          host: {
            id: host.id,
            nickname: host.nickname,
            groupId: host.group_id,
            groupName: host.group_name,
            isMe: host.id === me.id,
            readToday: host.last_read_date === today,
            versesRead: host.verses_read || 0,
            chaptersRead: host.chapters_read || 0,
            booksCompleted: host.books_completed || 0,
            currentStreak: host.current_streak || 0,
            gardenItems: safeParseJSON(host.garden_items_json, []),
            wateredByMeToday: Boolean(watered)
          },
          guestbook
        });
      }

      // Water (+5 host / +2 visitor seedling energy!) OR Send Preset Blessing
      if (method === 'POST' && path === '/api/group/interact') {
        const body = await readBody(request);
        const toUserId = Number(body.toUserId);
        const kind = body.kind === 'blessing' ? 'blessing' : 'water';
        const message = String(body.message || '').trim().slice(0, 60);
        const today = taiwanDateISO();

        if (!toUserId || toUserId === me.id) {
          return errResp(request, '無法對自己的花園進行這個互動喔', 400);
        }

        const host = await env.DB.prepare('SELECT id, nickname, group_id FROM users WHERE id = ?').bind(toUserId).first();
        if (!host) return errResp(request, '找不到該位組員', 404);
        if (host.group_id !== me.group_id && me.role !== 'admin') {
          return errResp(request, '僅限同小組組員互動', 403);
        }

        if (kind === 'water') {
          const already = await env.DB.prepare(`
            SELECT 1 FROM garden_interactions
            WHERE from_user_id = ? AND to_user_id = ? AND kind = 'water' AND day_iso = ?
          `).bind(me.id, toUserId, today).first();
          if (already) return errResp(request, '今天已經幫這位組員澆過水囉，明天再來！', 409);

          // Daily cap for host receiving water energy (max 5 waters = +25/day)
          const receivedRow = await env.DB.prepare(`
            SELECT COUNT(*) AS cnt FROM garden_interactions
            WHERE to_user_id = ? AND kind = 'water' AND day_iso = ?
          `).bind(toUserId, today).first();
          const hostGain = (receivedRow?.cnt || 0) < 5 ? 5 : 0;

          await env.DB.prepare(`
            INSERT INTO garden_interactions (from_user_id, to_user_id, group_id, kind, message, day_iso)
            VALUES (?, ?, ?, 'water', '幫你的花園澆了水 💧', ?)
          `).bind(me.id, toUserId, host.group_id, today).run();

          if (hostGain > 0) {
            await env.DB.prepare('UPDATE users SET water_energy = water_energy + ? WHERE id = ?').bind(hostGain, toUserId).run();
          }
          await env.DB.prepare('UPDATE users SET water_energy = water_energy + 2 WHERE id = ?').bind(me.id).run();

          return jsonResp(request, {
            ok: true,
            kind: 'water',
            hostGain,
            visitorGain: 2,
            message: `💧 已幫 ${host.nickname} 澆水（對方花苗 +${hostGain}，你也獲得祝福回饋 +2！）`
          });
        } else {
          if (!message) return errResp(request, '請選擇一句祝福話語', 400);
          await env.DB.prepare(`
            INSERT INTO garden_interactions (from_user_id, to_user_id, group_id, kind, message, day_iso)
            VALUES (?, ?, ?, 'blessing', ?, ?)
          `).bind(me.id, toUserId, host.group_id, message, today).run();
          return jsonResp(request, { ok: true, kind: 'blessing', message: `🙏 已將「${message}」送給 ${host.nickname}！` });
        }
      }

      // Claim weekly cooperative group goal reward (+100 seedling energy = 1 free garden unlock!)
      if (method === 'POST' && path === '/api/group/claim-weekly') {
        const today = taiwanDateISO();
        const wk = taiwanWeekKey(today);
        const already = await env.DB.prepare(`
          SELECT 1 FROM weekly_goal_claims WHERE user_id = ? AND week_key = ?
        `).bind(me.id, wk).first();
        if (already) return errResp(request, '本週的小組同心獎勵已經領過囉！', 409);

        const group = await env.DB.prepare('SELECT id, weekly_target_per_member FROM groups WHERE id = ?').bind(me.group_id).first();
        const cntRow = await env.DB.prepare('SELECT COUNT(*) AS cnt FROM users WHERE group_id = ?').bind(me.group_id).first();
        const wkRow = await env.DB.prepare('SELECT COALESCE(SUM(verses_delta), 0) AS total FROM weekly_reading_log WHERE group_id = ? AND week_key = ?').bind(me.group_id, wk).first();
        const target = Math.max(1, cntRow?.cnt || 1) * (group?.weekly_target_per_member || 350);

        if ((wkRow?.total || 0) < target) {
          return errResp(request, '小組本週共讀目標尚未達標，大家一起加油！', 400);
        }

        await env.DB.prepare('INSERT INTO weekly_goal_claims (user_id, group_id, week_key) VALUES (?, ?, ?)').bind(me.id, me.group_id, wk).run();
        await env.DB.prepare('UPDATE users SET water_energy = water_energy + 100 WHERE id = ?').bind(me.id).run();
        return jsonResp(request, { ok: true, bonusEnergy: 100, message: '🎉 恭喜達成小組每週同心目標！獲得 1 株獎勵花苗（+100 能量）！' });
      }

      // === GROUP REFLECTION WALL ===
      if (method === 'GET' && path === '/api/group/reflections') {
        const targetGroupId = (me.role === 'admin' && url.searchParams.get('groupId'))
          ? Number(url.searchParams.get('groupId'))
          : me.group_id;

        const { results: posts } = await env.DB.prepare(`
          SELECT r.id, r.user_id, r.date_iso, r.mood, r.verse, r.note, r.created_at, u.nickname AS author_name
          FROM reflections r
          JOIN users u ON u.id = r.user_id
          WHERE r.group_id = ? AND r.is_shared = 1
          ORDER BY r.id DESC
          LIMIT 50
        `).bind(targetGroupId).all();

        const ids = posts.map(p => p.id);
        const rxMap = new Map();
        if (ids.length > 0) {
          const placeholders = ids.map(() => '?').join(',');
          const { results: rxRows } = await env.DB.prepare(`
            SELECT reflection_id, reaction, user_id FROM reflection_reactions
            WHERE reflection_id IN (${placeholders})
          `).bind(...ids).all();
          for (const r of rxRows) {
            if (!rxMap.has(r.reflection_id)) {
              rxMap.set(r.reflection_id, { amen: 0, encouraged: 0, pray: 0, mine: [] });
            }
            const agg = rxMap.get(r.reflection_id);
            if (agg[r.reaction] !== undefined) agg[r.reaction]++;
            if (r.user_id === me.id) agg.mine.push(r.reaction);
          }
        }

        return jsonResp(request, {
          ok: true,
          posts: posts.map(p => ({
            id: p.id,
            authorName: p.author_name,
            isMine: p.user_id === me.id,
            date: p.date_iso,
            mood: p.mood,
            verse: p.verse,
            note: p.note,
            reactions: rxMap.get(p.id) || { amen: 0, encouraged: 0, pray: 0, mine: [] }
          }))
        });
      }

      if (method === 'POST' && path === '/api/reflections') {
        const body = await readBody(request);
        const verse = String(body.verse || '').trim().slice(0, 80);
        const note = String(body.note || '').trim().slice(0, 800);
        const mood = String(body.mood || '✨').slice(0, 6);
        const isShared = body.isShared === false ? 0 : 1;
        const dateIso = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : taiwanDateISO();

        if (!verse && !note) return errResp(request, '請輸入經文或感動內容', 400);

        const row = await env.DB.prepare(`
          INSERT INTO reflections (user_id, group_id, date_iso, mood, verse, note, is_shared)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          RETURNING id, date_iso, mood, verse, note, is_shared, created_at
        `).bind(me.id, me.group_id, dateIso, mood, verse, note, isShared).first();

        return jsonResp(request, { ok: true, entry: row }, 201);
      }

      const delRefMatch = path.match(/^\/api\/reflections\/(\d+)$/);
      if (method === 'DELETE' && delRefMatch) {
        const refId = Number(delRefMatch[1]);
        if (me.role === 'admin') {
          await env.DB.prepare('DELETE FROM reflections WHERE id = ?').bind(refId).run();
        } else {
          await env.DB.prepare('DELETE FROM reflections WHERE id = ? AND user_id = ?').bind(refId, me.id).run();
        }
        return jsonResp(request, { ok: true });
      }

      const reactMatch = path.match(/^\/api\/reflections\/(\d+)\/react$/);
      if (method === 'POST' && reactMatch) {
        const refId = Number(reactMatch[1]);
        const body = await readBody(request);
        const reaction = ['amen', 'encouraged', 'pray'].includes(body.reaction) ? body.reaction : 'amen';

        const exists = await env.DB.prepare(`
          SELECT 1 FROM reflection_reactions WHERE reflection_id = ? AND user_id = ? AND reaction = ?
        `).bind(refId, me.id, reaction).first();

        if (exists) {
          await env.DB.prepare(`
            DELETE FROM reflection_reactions WHERE reflection_id = ? AND user_id = ? AND reaction = ?
          `).bind(refId, me.id, reaction).run();
          return jsonResp(request, { ok: true, active: false });
        } else {
          await env.DB.prepare(`
            INSERT INTO reflection_reactions (reflection_id, user_id, reaction) VALUES (?, ?, ?)
          `).bind(refId, me.id, reaction).run();
          return jsonResp(request, { ok: true, active: true });
        }
      }

      // === ZONE LEADER ADMIN ENDPOINTS ===
      if (method === 'POST' && path === '/api/admin/claim') {
        const body = await readBody(request);
        const code = String(body.code || '').trim();
        const expected = env.ADMIN_CODE || '';
        if (!expected) return errResp(request, '系統尚未設定區長啟用碼', 500);

        const hIn = await sha256Hex(code);
        const hEx = await sha256Hex(expected);
        if (!timingSafeEqualHex(hIn, hEx)) {
          return errResp(request, '區長啟用碼不正確', 403);
        }

        await env.DB.prepare("UPDATE users SET role = 'admin' WHERE id = ?").bind(me.id).run();
        return jsonResp(request, { ok: true, role: 'admin', message: '👑 已成功啟用區長管理後台權限！' });
      }

      if (path.startsWith('/api/admin/')) {
        if (me.role !== 'admin') return errResp(request, '僅限區長存取此管理功能', 403);

        const today = taiwanDateISO();
        const wk = taiwanWeekKey(today);

        if (method === 'GET' && path === '/api/admin/dashboard') {
          const { results: groups } = await env.DB.prepare('SELECT id, name, sort_order, weekly_target_per_member FROM groups ORDER BY sort_order ASC, id ASC').all();
          const { results: users } = await env.DB.prepare(`
            SELECT u.id, u.phone, u.nickname, u.group_id, g.name AS group_name, u.role,
                   u.verses_read, u.chapters_read, u.books_completed, u.current_streak,
                   u.longest_streak, u.last_read_date, u.last_active_at, u.created_at
            FROM users u JOIN groups g ON g.id = u.group_id
            ORDER BY g.sort_order ASC, u.verses_read DESC
          `).all();
          const { results: wkLogs } = await env.DB.prepare(`
            SELECT group_id, user_id, verses_delta FROM weekly_reading_log WHERE week_key = ?
          `).bind(wk).all();

          const wkByGroup = new Map();
          const wkActiveUsers = new Set();
          for (const row of wkLogs) {
            wkByGroup.set(row.group_id, (wkByGroup.get(row.group_id) || 0) + (row.verses_delta || 0));
            if (row.verses_delta > 0) wkActiveUsers.add(row.user_id);
          }

          const todayMs = new Date(`${today}T00:00:00Z`).getTime();
          const enrichedUsers = users.map(u => {
            let daysIdle = null;
            if (u.last_read_date) {
              const lastMs = new Date(`${u.last_read_date}T00:00:00Z`).getTime();
              daysIdle = Math.max(0, Math.round((todayMs - lastMs) / 86400000));
            }
            return {
              id: u.id,
              phoneMasked: u.phone.length >= 7 ? `${u.phone.slice(0, 4)}***${u.phone.slice(-3)}` : u.phone,
              nickname: u.nickname,
              groupId: u.group_id,
              groupName: u.group_name,
              role: u.role,
              versesRead: u.verses_read || 0,
              chaptersRead: u.chapters_read || 0,
              booksCompleted: u.books_completed || 0,
              currentStreak: u.current_streak || 0,
              readToday: u.last_read_date === today,
              lastReadDate: u.last_read_date,
              daysIdle
            };
          });

          const groupSummary = groups.map(g => {
            const gMembers = enrichedUsers.filter(u => u.groupId === g.id);
            const readTodayCnt = gMembers.filter(u => u.readToday).length;
            const activeWeekCnt = gMembers.filter(u => wkActiveUsers.has(u.id)).length;
            const totalV = gMembers.reduce((s, u) => s + u.versesRead, 0);
            const wkVerses = wkByGroup.get(g.id) || 0;
            const wkTarget = Math.max(1, gMembers.length) * (g.weekly_target_per_member || 350);
            return {
              id: g.id,
              name: g.name,
              sortOrder: g.sort_order,
              memberCount: gMembers.length,
              readTodayCount: readTodayCnt,
              readTodayPct: gMembers.length ? Math.round((readTodayCnt / gMembers.length) * 100) : 0,
              activeWeekCount: activeWeekCnt,
              totalVerses: totalV,
              weeklyVerses: wkVerses,
              weeklyTarget: wkTarget,
              weeklyPct: gMembers.length ? Math.min(100, Math.round((wkVerses / wkTarget) * 100)) : 0
            };
          });

          const totalMembers = enrichedUsers.length;
          const totalReadToday = enrichedUsers.filter(u => u.readToday).length;
          const totalVersesAll = enrichedUsers.reduce((s, u) => s + u.versesRead, 0);
          const totalChaptersAll = enrichedUsers.reduce((s, u) => s + u.chaptersRead, 0);

          const careList = enrichedUsers
            .filter(u => u.daysIdle === null || u.daysIdle >= 3)
            .sort((a, b) => (b.daysIdle ?? 999) - (a.daysIdle ?? 999));

          return jsonResp(request, {
            ok: true,
            today,
            weekKey: wk,
            kpis: {
              totalMembers,
              totalReadToday,
              readTodayPct: totalMembers ? Math.round((totalReadToday / totalMembers) * 100) : 0,
              weeklyActiveCount: wkActiveUsers.size,
              totalChaptersAll,
              totalVersesAll
            },
            groups: groupSummary,
            careList,
            members: enrichedUsers
          });
        }

        // Add new small group (e.g., 8th group anytime!)
        if (method === 'POST' && path === '/api/admin/groups') {
          const body = await readBody(request);
          const name = String(body.name || '').trim().slice(0, 20);
          if (!name) return errResp(request, '請輸入小組名稱', 400);
          const maxRow = await env.DB.prepare('SELECT COALESCE(MAX(sort_order), 0) AS mx FROM groups').first();
          const inserted = await env.DB.prepare(`
            INSERT INTO groups (name, sort_order) VALUES (?, ?) RETURNING id, name, sort_order
          `).bind(name, (maxRow?.mx || 0) + 1).first();
          return jsonResp(request, { ok: true, group: inserted }, 201);
        }

        // Rename small group
        const grpPatch = path.match(/^\/api\/admin\/groups\/(\d+)$/);
        if (method === 'PATCH' && grpPatch) {
          const gid = Number(grpPatch[1]);
          const body = await readBody(request);
          const name = String(body.name || '').trim().slice(0, 20);
          if (!name) return errResp(request, '小組名稱不能空白', 400);
          await env.DB.prepare('UPDATE groups SET name = ? WHERE id = ?').bind(name, gid).run();
          return jsonResp(request, { ok: true });
        }

        // Admin assist member: move group or reset 4-digit birthday PIN
        const usrPatch = path.match(/^\/api\/admin\/users\/(\d+)$/);
        if (method === 'PATCH' && usrPatch) {
          const uid = Number(usrPatch[1]);
          const body = await readBody(request);
          if (body.groupId) {
            await env.DB.prepare('UPDATE users SET group_id = ? WHERE id = ?').bind(Number(body.groupId), uid).run();
          }
          if (body.newPin) {
            const np = normalizePin(body.newPin);
            if (np.length !== 4) return errResp(request, '新生日密碼須為 4 位數字', 400);
            const salt = randomHex(16);
            const hash = await sha256Hex(`${salt}:${np}`);
            await env.DB.prepare('UPDATE users SET pin_salt = ?, pin_hash = ? WHERE id = ?').bind(salt, hash, uid).run();
          }
          return jsonResp(request, { ok: true });
        }

        // CSV Export for seasonal pastoral awards
        if (method === 'GET' && path === '/api/admin/export.csv') {
          const { results } = await env.DB.prepare(`
            SELECT g.name AS group_name, u.nickname, u.verses_read, u.chapters_read,
                   u.books_completed, u.current_streak, u.longest_streak, u.last_read_date
            FROM users u JOIN groups g ON g.id = u.group_id
            ORDER BY g.sort_order ASC, u.verses_read DESC
          `).all();
          const header = '小組,姓名暱稱,累積節數,累積章數,完讀書卷,目前連續天數,最長連續天數,最後讀經日';
          const lines = results.map(r =>
            [r.group_name, r.nickname, r.verses_read, r.chapters_read, r.books_completed, r.current_streak, r.longest_streak, r.last_read_date || '']
              .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
          );
          const csv = '\uFEFF' + [header, ...lines].join('\n');
          return new Response(csv, {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="牧區讀經報表_${today}.csv"`,
              ...corsHeaders(request)
            }
          });
        }
      }

      return errResp(request, 'API 路徑不存在', 404);
    } catch (err) {
      return errResp(request, `伺服器處理錯誤：${err?.message || 'Unknown error'}`, 500);
    }
  }
};
