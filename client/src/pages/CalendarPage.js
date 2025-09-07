import React, { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

/** Google Calendar colorId(1~11) → 근사 HEX (표시용) */
const GOOGLE_COLORS = {
  1:  '#7986cb', 2: '#33b679', 3: '#8e24aa', 4: '#e67c73', 5: '#f6c026',
  6:  '#f5511d', 7: '#039be5', 8: '#616161', 9: '#3f51b5', 10: '#0b8043', 11: '#d50000',
};

/** UI 팔레트(네가 준 색) */
const UI_COLORS = ['#EF4444','#F97316','#FACC15','#4ADE80','#22C55E','#14B8A6','#3B82F6','#6366F1','#A855F7','#EC4899'];
/** UI 팔레트 → Google colorId 매핑 */
const UI_TO_GOOGLE_ID = [11,6,5,10,2,7,9,9,3,4];

export default function CalendarPage() {
  const CLIENT_ID      = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const API_KEY        = process.env.REACT_APP_GOOGLE_API_KEY; // (로더에는 안 씀)
  const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
  const SCOPES         = 'https://www.googleapis.com/auth/calendar.events';
  const CALENDAR_ID    = 'primary';

  const [isSignedIn, setSignedIn]   = useState(false);
  const [gisReady, setGisReady]     = useState(false);
  const [gapiReady, setGapiReady]   = useState(false);

  const calRef = useRef(null);
  const tokenClientRef = useRef(null);
  const pendingSelectRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('create'); // 'create' | 'edit'
  const [editingEvent, setEditingEvent] = useState(null);

  const [form, setForm] = useState({
    title: '',
    start: '',
    end: '',
    allDay: true,
    description: '',
    saveToGoogle: false,
    color: UI_COLORS[0],
    colorId: String(UI_TO_GOOGLE_ID[0]),
  });

  // ───────────────── Google 스크립트 로드 대기 → 초기화
  useEffect(() => {
    const iv = setInterval(() => {
      if (!gisReady && window.google?.accounts?.oauth2) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (resp) => {
            if (resp?.error) { console.error(resp); return; }
            window.gapi.client.setToken({ access_token: resp.access_token });
            setSignedIn(true);
          },
          use_fedcm_for_prompt: false,
        });
        setGisReady(true);
      }
      if (!gapiReady && window.gapi?.load) {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({ apiKey: API_KEY, discoveryDocs: DISCOVERY_DOCS });
            setGapiReady(true);
          } catch (e) { console.error('gapi init failed:', e); }
        });
      }
    }, 100);
    return () => clearInterval(iv);
  }, [gisReady, gapiReady, CLIENT_ID, API_KEY]);

  const scriptsReady = gisReady && gapiReady;

  // ───────────────── 로그인/로그아웃
  const handleLogin = () => {
    if (!scriptsReady || !tokenClientRef.current) return;
    const token = window.gapi?.client?.getToken?.();
    tokenClientRef.current.requestAccessToken({ prompt: token ? '' : 'consent' });
  };
  const handleLogout = () => {
    const token = window.gapi?.client?.getToken?.();
    if (token?.access_token) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {
        window.gapi.client.setToken('');
        setSignedIn(false);
      });
    } else setSignedIn(false);
  };

  // ───────────────── 유틸
  const isGoogleEvent = (event) => Boolean(event?.extendedProps?._google); // ✅ 로더 표시 사용
  const mapGoogleColor = (colorId) => GOOGLE_COLORS[Number(colorId)] || '#3B82F6';

  // OAuth 로더: 화면 범위만 사용자 캘린더에서 읽어오기
  const loadGoogleEvents = (fetchInfo, successCallback, failureCallback) => {
    if (!isSignedIn) { successCallback([]); return; }
    window.gapi.client.calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: fetchInfo.startStr,
      timeMax: fetchInfo.endStr,
      singleEvents: true,
      showDeleted: false,
      maxResults: 2500,
      orderBy: 'startTime',
    }).then(res => {
      const events = (res.result.items || []).map(it => ({
        id: it.id,
        title: it.summary || '(제목 없음)',
        start: it.start?.dateTime || it.start?.date,
        end:   it.end?.dateTime   || it.end?.date,
        allDay: Boolean(it.start?.date),
        backgroundColor: mapGoogleColor(it.colorId),
        borderColor: mapGoogleColor(it.colorId),
        extendedProps: { description: it.description || '', _google: true }, // ✅ 표시
      }));
      successCallback(events);
    }).catch(failureCallback);
  };

  // ───────────────── 모달 열기/닫기
  const openCreateModal = (info) => {
    pendingSelectRef.current = info;
    const startISO = info.startStr;
    const endISO   = info.endStr || startISO;
    setMode('create');
    setEditingEvent(null);
    setForm({
      title: '',
      start: startISO,
      end: endISO,
      allDay: info.allDay ?? true,
      description: '',
      saveToGoogle: isSignedIn,
      color: UI_COLORS[0],
      colorId: String(UI_TO_GOOGLE_ID[0]),
    });
    setOpen(true);
  };

  const openEditModal = (clickInfo) => {
    const ev = clickInfo.event;
    const allDay = ev.allDay;
    const startISO = allDay ? ev.start.toISOString().slice(0,10) + 'T00:00:00' : ev.start.toISOString().slice(0,16);
    const endISO   = ev.end ? (allDay ? ev.end.toISOString().slice(0,10) + 'T00:00:00' : ev.end.toISOString().slice(0,16)) : startISO;
    setMode('edit');
    setEditingEvent(ev);
    setForm({
      title: ev.title || '',
      start: startISO,
      end: endISO,
      allDay,
      description: ev.extendedProps?.description || '',
      saveToGoogle: isGoogleEvent(ev), // ✅ 구글 이벤트면 반영
      color: ev.backgroundColor || UI_COLORS[0],
      colorId: String(UI_TO_GOOGLE_ID[0]),
    });
    setOpen(true);
  };

  const closeModal = () => {
    pendingSelectRef.current?.view?.calendar?.unselect?.();
    setOpen(false);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onClickBubbleColor = (idx) => {
    const cid = UI_TO_GOOGLE_ID[idx];
    setForm((f) => ({ ...f, color: UI_COLORS[idx], colorId: String(cid) }));
  };

  // ───────────────── 저장/수정/삭제
  const toResourceFromForm = (f) => {
    const base = { summary: f.title, description: f.description, ...(f.colorId ? { colorId: String(f.colorId) } : {}) };
    if (f.allDay) return { ...base, start: { date: f.start.slice(0,10) }, end: { date: f.end.slice(0,10) } };
    return { ...base, start: { dateTime: f.start }, end: { dateTime: f.end || f.start } };
  };

  const saveEvent = async () => {
    const calendarApi = calRef.current?.getApi();
    const f = form;
    if (!f.title || !f.title.trim()) return;

    try {
      if (mode === 'create') {
        if (f.saveToGoogle && isSignedIn) {
          await window.gapi.client.calendar.events.insert({ calendarId: CALENDAR_ID, resource: toResourceFromForm(f) });
          calendarApi?.refetchEvents?.();
        } else {
          calendarApi?.addEvent({
            title: f.title, start: f.start, end: f.end || f.start, allDay: f.allDay,
            extendedProps: { description: f.description, _google: false },
            backgroundColor: f.color, borderColor: f.color,
          });
        }
      } else if (mode === 'edit' && editingEvent) {
        const ev = editingEvent;
        if (isGoogleEvent(ev) && isSignedIn && f.saveToGoogle) {
          await window.gapi.client.calendar.events.update({
            calendarId: CALENDAR_ID, eventId: ev.id, resource: toResourceFromForm(f),
          });
          calendarApi?.refetchEvents?.();
        } else {
          ev.setProp('title', f.title);
          ev.setExtendedProp('description', f.description);
          ev.setAllDay(f.allDay);
          ev.setDates(f.start, f.end || f.start, { allDay: f.allDay });
          ev.setProp('backgroundColor', f.color);
          ev.setProp('borderColor', f.color);
        }
      }
    } catch (err) {
      console.error('저장 실패:', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setOpen(false);
    }
  };

  const deleteEvent = async () => {
    if (mode !== 'edit' || !editingEvent) return;
    const calendarApi = calRef.current?.getApi();
    const ev = editingEvent;
    try {
      if (isGoogleEvent(ev) && isSignedIn) {
        await window.gapi.client.calendar.events.delete({ calendarId: CALENDAR_ID, eventId: ev.id });
        calendarApi?.refetchEvents?.();
      } else {
        ev.remove();
      }
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setOpen(false);
    }
  };

  const onEventDropOrResize = async (changeInfo) => {
    const ev = changeInfo.event;
    if (!isGoogleEvent(ev) || !isSignedIn) return;
    const allDay = ev.allDay;
    const startISO = allDay ? ev.start.toISOString().slice(0,10) + 'T00:00:00' : ev.start.toISOString();
    const endISO   = ev.end ? (allDay ? ev.end.toISOString().slice(0,10) + 'T00:00:00' : ev.end.toISOString()) : startISO;

    try {
      await window.gapi.client.calendar.events.update({
        calendarId: CALENDAR_ID,
        eventId: ev.id,
        resource: {
          summary: ev.title,
          description: ev.extendedProps?.description || '',
          ...(allDay
            ? { start: { date: startISO.slice(0,10) }, end: { date: endISO.slice(0,10) } }
            : { start: { dateTime: startISO },        end: { dateTime: endISO } }),
        },
      });
    } catch (err) {
      console.error('드래그/리사이즈 반영 실패:', err);
      changeInfo.revert();
    }
  };

  // ───────────────── 렌더
  return (
    <div style={{ padding: 20 }}>
      {/* 제목 길이로 줄바꿈 생겨 높이 늘어나는 것 방지 */}
      <style>{`
        .fc-daygrid-event .fc-event-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>

      {isSignedIn ? (
        <button onClick={handleLogout}>로그아웃</button>
      ) : (
        <button onClick={handleLogin} disabled={!scriptsReady} style={{ opacity: scriptsReady ? 1 : 0.6 }}>
          {scriptsReady ? '구글 계정으로 로그인' : '로그인 모듈 로딩 중...'}
        </button>
      )}

      <div style={{ height: 16 }} />

      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"

        /* ── 고정 레이아웃: 행 높이 절대 안 늘어남 ── */
        height={760}           /* 전체 높이 고정 */
        expandRows={true}      /* 고정 높이를 6주에 균등 분배 */
        fixedWeekCount={true}  /* 항상 6주 표시(일관된 높이) */
        dayMaxEventRows={2}    /* 한 칸당 보여줄 이벤트 줄 수 제한(멀티데이 포함) */
        dayMaxEvents={3}       /* 한 칸당 단일 이벤트 개수 제한 */
        moreLinkClick="popover"

        /* 선택/편집 */
        selectable
        selectMirror
        editable
        eventDurationEditable
        eventStartEditable

        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek,dayGridDay' }}

        /* ✅ OAuth 로더(내 캘린더) */
        events={loadGoogleEvents}

        select={openCreateModal}
        eventClick={openEditModal}
        eventDrop={onEventDropOrResize}
        eventResize={onEventDropOrResize}
      />

      {open && (
        <div
          role="dialog" aria-modal="true"
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'grid', placeItems:'center', zIndex:1000 }}
          onClick={closeModal}
        >
          <div
            style={{ width:460, background:'#1f2937', color:'white', borderRadius:12, padding:20, boxShadow:'0 10px 30px rgba(0,0,0,0.4)' }}
            onClick={(e)=>e.stopPropagation()}
          >
            <h3 style={{ margin:'0 0 12px 0' }}>{mode === 'create' ? '일정 추가' : '일정 수정'}</h3>

            <label style={{ display:'block', fontSize:13, opacity:0.8 }}>제목</label>
            <input
              name="title" value={form.title} onChange={onChange} placeholder="예: 팀 회의"
              style={{ width:'90%', padding:10, borderRadius:8, border:'1px solid #374151', marginTop:6, marginBottom:12, background:'#111827', color:'white' }}
            />

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ display:'block', fontSize:13, opacity:0.8 }}>시작</label>
                <input
                  type={form.allDay ? 'date' : 'datetime-local'}
                  name="start"
                  value={form.allDay ? form.start.slice(0,10) : form.start.slice(0,16)}
                  onChange={(e)=>{ const v=e.target.value; setForm(f=>({ ...f, start: form.allDay ? `${v}T00:00:00` : v })); }}
                  style={{ width:'80%', padding:10, borderRadius:8, border:'1px solid #374151', marginTop:6, background:'#111827', color:'white' }}
                />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, opacity:0.8 }}>종료</label>
                <input
                  type={form.allDay ? 'date' : 'datetime-local'}
                  name="end"
                  value={form.allDay ? form.end.slice(0,10) : form.end.slice(0,16)}
                  onChange={(e)=>{ const v=e.target.value; setForm(f=>({ ...f, end: form.allDay ? `${v}T00:00:00` : v })); }}
                  style={{ width:'80%', padding:10, borderRadius:8, border:'1px solid #374151', marginTop:6, background:'#111827', color:'white' }}
                />
              </div>
            </div>

            <div style={{ display:'flex', gap:16, alignItems:'center', marginTop:12 }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                <input type="checkbox" name="allDay" checked={form.allDay} onChange={(e)=>setForm(f=>({...f, allDay:e.target.checked}))} />
                종일
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} title={isSignedIn ? '' : '로그인하면 사용할 수 있어요'}>
                <input type="checkbox" name="saveToGoogle" checked={isSignedIn ? form.saveToGoogle : false} disabled={!isSignedIn} onChange={onChange} />
                Google 캘린더에 {mode === 'create' ? '저장' : '반영'}
              </label>
            </div>

            <div style={{ marginTop:12 }}>
              <label style={{ display:'block', fontSize:13, opacity:0.8 }}>색상</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:6 }}>
                {UI_COLORS.map((hex, idx) => (
                  <button
                    key={hex} type="button" aria-label={`색상 ${idx+1}`} onClick={()=>onClickBubbleColor(idx)}
                    style={{
                      width:28, height:28, borderRadius:'50%', background:hex,
                      border: UI_TO_GOOGLE_ID[idx] === Number(form.colorId) ? '3px solid white' : '2px solid transparent',
                      cursor:'pointer', boxShadow:'0 0 3px rgba(0,0,0,0.4)'
                    }}
                  />
                ))}
              </div>
            </div>

            <label style={{ display:'block', fontSize:13, opacity:0.8, marginTop:12 }}>설명</label>
            <textarea
              name="description" value={form.description} onChange={onChange} rows={3} placeholder="메모를 입력하세요"
              style={{ width:'90%', padding:10, borderRadius:8, border:'1px solid #374151', marginTop:6, background:'#111827', color:'white' }}
            />

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:16 }}>
              {mode === 'edit' ? (
                <button onClick={deleteEvent} style={{ padding:'8px 12px', borderRadius:8, background:'#ef4444', color:'white' }}>삭제</button>
              ) : <span />}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={closeModal} style={{ padding:'8px 12px', borderRadius:8 }}>취소</button>
                <button onClick={saveEvent} style={{ padding:'8px 12px', borderRadius:8, background:'#3b82f6', color:'white' }}>저장</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
