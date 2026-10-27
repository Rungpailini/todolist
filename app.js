/**
 * TeamFlow - Team Kanban & Overview Management System
 * LocalStorage powered, reactive state and HTML5 drag-and-drop
 */

// Initial Default Data (used on first load or reset)
const DEFAULT_MEMBERS = [
  { id: 'mem-1', name: 'สมชาย สายลุย', role: 'Frontend Developer', avatar: '💻', color: 'indigo' },
  { id: 'mem-2', name: 'สมศรี มีวินัย', role: 'Backend Developer', avatar: '⚙️', color: 'emerald' },
  { id: 'mem-3', name: 'อานนท์ ออกแบบ', role: 'UI/UX Designer', avatar: '🎨', color: 'pink' },
  { id: 'mem-4', name: 'กัญญา การตลาด', role: 'Product Manager', avatar: '📊', color: 'amber' }
];

// Helper to get formatted date string (YYYY-MM-DD)
function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const DEFAULT_TASKS = [
  {
    id: 'task-101',
    title: 'ออกแบบหน้าจอ Kanban และ UI ระบบจัดการงาน',
    description: 'จัดทำ wireframe และ Prototype สำหรับหน้าบอร์ดของทีมงานและหน้าแดชบอร์ดของหัวหน้างาน',
    assigneeId: 'mem-3',
    startDate: getDateOffset(-4),
    deadline: getDateOffset(-1), // Overdue
    priority: 'urgent',
    status: 'in_progress',
    createdAt: Date.now() - 340000000
  },
  {
    id: 'task-102',
    title: 'พัฒนาระบบ Drag and Drop บนคัมบังบอร์ด',
    description: 'ใช้ HTML5 drag & drop API ให้ผู้ใช้สามารถลากการ์ดย้ายสถานะได้อย่างลื่นไหล รองรับการบันทึกสถานะทันที',
    assigneeId: 'mem-1',
    startDate: getDateOffset(-2),
    deadline: getDateOffset(0), // Today
    priority: 'high',
    status: 'in_progress',
    createdAt: Date.now() - 250000000
  },
  {
    id: 'task-103',
    title: 'ทำ API สำหรับสรุปข้อมูลแดชบอร์ดภาพรวมทีม',
    description: 'รวบรวมข้อมูลสถิติ สัดส่วนงานที่เสร็จสิ้น อัตราความสำเร็จ และภาระงานของสมาชิกแต่ละคน',
    assigneeId: 'mem-2',
    startDate: getDateOffset(-3),
    deadline: getDateOffset(2),
    priority: 'high',
    status: 'review',
    createdAt: Date.now() - 200000000
  },
  {
    id: 'task-104',
    title: 'กำหนดเกณฑ์และ User Story สำหรับฟีเจอร์ Sprint ถัดไป',
    description: 'ประชุมร่วมกับลูกค้าเพื่อเก็บ Requirement และจัดลำดับความสำคัญของ backlog',
    assigneeId: 'mem-4',
    startDate: getDateOffset(-1),
    deadline: getDateOffset(4),
    priority: 'medium',
    status: 'todo',
    createdAt: Date.now() - 100000000
  },
  {
    id: 'task-105',
    title: 'ทดสอบระบบการส่งออกและนำเข้าข้อมูล (Export/Import JSON)',
    description: 'ตรวจสอบความถูกต้องของโครงสร้างไฟล์ JSON และการรองรับ LocalStorage ขนาดใหญ่',
    assigneeId: 'mem-1',
    startDate: getDateOffset(-5),
    deadline: getDateOffset(-2),
    priority: 'low',
    status: 'done',
    createdAt: Date.now() - 400000000
  },
  {
    id: 'task-106',
    title: 'ปรับปรุงประสิทธิภาพฐานข้อมูล SQLite & Caching',
    description: 'ทำ Query Indexing เพื่อให้การดึงข้อมูลรายงานประจำสัปดาห์ทำงานได้เร็วขึ้น',
    assigneeId: 'mem-2',
    startDate: getDateOffset(-6),
    deadline: getDateOffset(-3),
    priority: 'medium',
    status: 'done',
    createdAt: Date.now() - 500000000
  }
];

// App State
const state = {
  currentUser: 'manager', // 'manager' or member ID (e.g. 'mem-1')
  viewMode: 'kanban', // 'kanban' or 'table'
  members: [],
  tasks: [],
  filters: {
    search: '',
    member: 'all',
    priority: 'all',
    deadline: 'all'
  },
  draggedTaskId: null
};

// Storage Keys
const STORAGE_KEYS = {
  MEMBERS: 'teamflow_members_v1',
  TASKS: 'teamflow_tasks_v1',
  CURRENT_USER: 'teamflow_current_user_v1'
};

/* ========================================================
   INITIALIZATION & DATA SYNC
   ======================================================== */

function initApp() {
  loadData();
  setupEventListeners();
  renderApp();
}

function loadData() {
  try {
    const savedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

    state.members = savedMembers ? JSON.parse(savedMembers) : [...DEFAULT_MEMBERS];
    state.tasks = savedTasks ? JSON.parse(savedTasks) : [...DEFAULT_TASKS];
    if (savedUser) {
      state.currentUser = savedUser;
    }
    saveData();
  } catch (e) {
    console.error('Error loading data from localStorage, resetting to defaults', e);
    state.members = [...DEFAULT_MEMBERS];
    state.tasks = [...DEFAULT_TASKS];
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(state.members));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, state.currentUser);
  } catch (e) {
    console.error('Error saving data to localStorage', e);
  }
}

/* ========================================================
   HELPERS & DATE FORMATTING
   ======================================================== */

function getMemberById(id) {
  return state.members.find(m => m.id === id) || {
    id: 'unknown',
    name: 'ไม่ได้ระบุ',
    role: '-',
    avatar: '👤',
    color: 'slate'
  };
}

function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10) + 543;
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const month = months[parseInt(parts[1], 10) - 1];
  const day = parseInt(parts[2], 10);
  return `${day} ${month} ${year}`;
}

function getDeadlineInfo(deadlineStr, isDone) {
  if (!deadlineStr) return { label: '-', status: 'normal', isOverdue: false };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = deadlineStr.split('-').map(Number);
  const deadline = new Date(y, m - 1, d);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline - today;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (isDone) {
    return {
      label: formatThaiDate(deadlineStr),
      status: 'done',
      isOverdue: false,
      badgeText: 'เสร็จแล้ว'
    };
  }

  if (diffDays < 0) {
    return {
      label: formatThaiDate(deadlineStr),
      status: 'overdue',
      isOverdue: true,
      badgeText: `เลยกำหนด ${Math.abs(diffDays)} วัน!`
    };
  } else if (diffDays === 0) {
    return {
      label: 'ส่งวันนี้!',
      status: 'today',
      isOverdue: false,
      badgeText: 'ส่งวันนี้'
    };
  } else if (diffDays === 1) {
    return {
      label: 'ส่งพรุ่งนี้',
      status: 'tomorrow',
      isOverdue: false,
      badgeText: 'ส่งพรุ่งนี้'
    };
  } else {
    return {
      label: formatThaiDate(deadlineStr),
      status: 'normal',
      isOverdue: false,
      badgeText: `อีก ${diffDays} วัน`
    };
  }
}

function getPriorityBadgeHtml(priority) {
  const map = {
    urgent: { text: '🔴 ด่วนมาก', class: 'badge-urgent' },
    high: { text: '🟠 สูง', class: 'badge-high' },
    medium: { text: '🟡 ปานกลาง', class: 'badge-medium' },
    low: { text: '🟢 ทั่วไป', class: 'badge-low' }
  };
  const item = map[priority] || map.medium;
  return `<span class="px-2 py-0.5 text-[11px] font-semibold rounded-md ${item.class}">${item.text}</span>`;
}

function getStatusBadgeHtml(status) {
  const map = {
    todo: { text: 'รอดำเนินการ', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    in_progress: { text: 'กำลังทำ', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    review: { text: 'รอตรวจ', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    done: { text: 'เสร็จสิ้น', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
  };
  const item = map[status] || map.todo;
  return `<span class="px-2 py-0.5 text-xs font-medium rounded-full border ${item.bg}">${item.text}</span>`;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  toastMsg.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
  }, 2500);
}

/* ========================================================
   RENDER FUNCTIONS
   ======================================================== */

function renderApp() {
  renderUserSelector();
  renderBanner();
  renderManagerDashboard();
  renderKanbanBoard();
  renderTableView();
  updateTopNavStats();
  if (window.lucide) {
    lucide.createIcons();
  }
}

function renderUserSelector() {
  const selector = document.getElementById('user-selector');
  const filterMember = document.getElementById('filter-member');
  const taskAssignee = document.getElementById('task-assignee');

  // Preserve selections
  const currentVal = state.currentUser;
  const currentFilter = state.filters.member;

  // Build options for User Switcher
  let optionsHtml = `<option value="manager" ${currentVal === 'manager' ? 'selected' : ''}>👑 หัวหน้างาน (ดูภาพรวมทุกคน)</option>`;
  optionsHtml += '<optgroup label="--- สมาชิกในทีม (เข้ามุมมองส่วนตัว) ---">';
  state.members.forEach(member => {
    optionsHtml += `<option value="${member.id}" ${currentVal === member.id ? 'selected' : ''}>${member.avatar} ${member.name} (${member.role})</option>`;
  });
  optionsHtml += '</optgroup>';
  selector.innerHTML = optionsHtml;

  // Build options for Member Filter (Manager view)
  let filterOptionsHtml = `<option value="all" ${currentFilter === 'all' ? 'selected' : ''}>ทุกคนในทีม (All Members)</option>`;
  state.members.forEach(member => {
    filterOptionsHtml += `<option value="${member.id}" ${currentFilter === member.id ? 'selected' : ''}>${member.name} (${member.role})</option>`;
  });
  filterMember.innerHTML = filterOptionsHtml;

  // Build options for Task Assignee select in modal
  let assigneeHtml = '';
  state.members.forEach(member => {
    assigneeHtml += `<option value="${member.id}">${member.avatar} ${member.name} (${member.role})</option>`;
  });
  taskAssignee.innerHTML = assigneeHtml;

  // Update Role Badge in Nav
  const roleBadge = document.getElementById('role-badge');
  if (state.currentUser === 'manager') {
    roleBadge.className = 'px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200';
    roleBadge.innerHTML = '👑 โหมดหัวหน้างาน';
  } else {
    const mem = getMemberById(state.currentUser);
    roleBadge.className = 'px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200';
    roleBadge.innerHTML = `👤 สมาชิก: ${mem.name}`;
  }
}

function renderBanner() {
  const bannerAvatar = document.getElementById('banner-avatar');
  const bannerTitle = document.getElementById('banner-title');
  const bannerTag = document.getElementById('banner-status-tag');
  const bannerDesc = document.getElementById('banner-desc');
  const managerSection = document.getElementById('manager-section');

  if (state.currentUser === 'manager') {
    managerSection.classList.remove('hidden');
    bannerAvatar.innerHTML = '👑';
    bannerTitle.textContent = 'หน้าหัวหน้างาน: ภาพรวมงานของทั้งทีม';
    bannerTag.textContent = 'Manager Overview';
    bannerTag.className = 'text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full';
    bannerDesc.textContent = 'คุณสามารถติดตามความคืบหน้าของลูกทีมทุกคน มอบหมายงาน และเห็นงานที่เสร็จสิ้นหรือเลยกำหนดส่งแบบเรียลไทม์';
  } else {
    // Member view
    managerSection.classList.add('hidden');
    const member = getMemberById(state.currentUser);
    const memberTasks = state.tasks.filter(t => t.assigneeId === member.id);
    const activeCount = memberTasks.filter(t => t.status !== 'done').length;

    bannerAvatar.innerHTML = member.avatar || '👤';
    bannerTitle.textContent = `บอร์ดงานส่วนตัว: คุณ${member.name}`;
    bannerTag.textContent = `ตำแหน่ง: ${member.role}`;
    bannerTag.className = 'text-xs bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full';
    bannerDesc.textContent = `ยินดีต้อนรับ! คุณมีงานที่ต้องทำทั้งหมด ${memberTasks.length} งาน (กำลังดำเนินการอยู่ ${activeCount} งาน) จัดการด้วยคัมบังบอร์ดด้านล่างได้เลย`;
  }
}

function updateTopNavStats() {
  const total = state.tasks.length;
  const doing = state.tasks.filter(t => t.status === 'in_progress').length;
  const done = state.tasks.filter(t => t.status === 'done').length;
  const overdue = state.tasks.filter(t => {
    if (t.status === 'done') return false;
    const info = getDeadlineInfo(t.deadline, false);
    return info.isOverdue;
  }).length;

  document.getElementById('nav-total-tasks').textContent = total;
  document.getElementById('nav-doing-tasks').textContent = doing;
  document.getElementById('nav-done-tasks').textContent = done;
  document.getElementById('nav-overdue-tasks').textContent = overdue;
}

function renderManagerDashboard() {
  if (state.currentUser !== 'manager') return;

  const total = state.tasks.length;
  const doing = state.tasks.filter(t => t.status === 'in_progress').length;
  const done = state.tasks.filter(t => t.status === 'done').length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const overdueList = state.tasks.filter(t => {
    if (t.status === 'done') return false;
    return getDeadlineInfo(t.deadline, false).isOverdue;
  });

  const dueTodayList = state.tasks.filter(t => {
    if (t.status === 'done') return false;
    return getDeadlineInfo(t.deadline, false).status === 'today';
  });

  document.getElementById('stat-total-tasks').textContent = total;
  document.getElementById('stat-doing-tasks').textContent = doing;
  document.getElementById('stat-done-tasks').textContent = done;
  document.getElementById('stat-completion-rate').textContent = `${percent}% อัตราความสำเร็จ`;

  document.getElementById('stat-alert-tasks').textContent = overdueList.length + dueTodayList.length;
  document.getElementById('stat-overdue-desc').textContent = overdueList.length > 0
    ? `เลยกำหนด ${overdueList.length} งาน (ส่งวันนี้ ${dueTodayList.length})`
    : (dueTodayList.length > 0 ? `ส่งวันนี้ ${dueTodayList.length} งาน` : 'ไม่มีงานค้างส่ง');

  // Render Workload Cards
  const workloadContainer = document.getElementById('members-workload-grid');
  workloadContainer.innerHTML = '';

  state.members.forEach(member => {
    const memberTasks = state.tasks.filter(t => t.assigneeId === member.id);
    const mTotal = memberTasks.length;
    const mDoing = memberTasks.filter(t => t.status === 'in_progress').length;
    const mDone = memberTasks.filter(t => t.status === 'done').length;
    const mOverdue = memberTasks.filter(t => t.status !== 'done' && getDeadlineInfo(t.deadline, false).isOverdue).length;
    const mPercent = mTotal > 0 ? Math.round((mDone / mTotal) * 100) : 0;

    const card = document.createElement('div');
    card.className = 'group p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition cursor-pointer';
    card.title = `คลิกเพื่อสลับไปดูบอร์ดของ ${member.name}`;
    card.onclick = () => {
      state.currentUser = member.id;
      saveData();
      renderApp();
      showToast(`สลับมุมมองไปยัง: ${member.name}`);
    };

    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="text-xl p-1 bg-white rounded-lg border border-slate-200">${member.avatar}</span>
          <div>
            <h4 class="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">${member.name}</h4>
            <span class="text-[10px] text-slate-500">${member.role}</span>
          </div>
        </div>
        <span class="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">${mTotal} งาน</span>
      </div>

      <div class="space-y-1.5 mt-3">
        <!-- Progress Bar -->
        <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div class="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style="width: ${mPercent}%"></div>
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-500">
          <span>ความคืบหน้า</span>
          <span class="font-medium text-slate-700">${mPercent}% (${mDone}/${mTotal})</span>
        </div>
      </div>

      <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-[11px]">
        <span class="text-amber-600 font-medium">กำลังทำ: ${mDoing}</span>
        ${mOverdue > 0 ? `<span class="text-rose-600 font-bold flex items-center gap-0.5"><i data-lucide="alert-circle" class="w-3 h-3"></i> เลยกำหนด ${mOverdue}</span>` : '<span class="text-emerald-600 font-medium">ไม่มีงานค้าง</span>'}
      </div>
    `;

    workloadContainer.appendChild(card);
  });
}

function getFilteredTasks() {
  let list = [...state.tasks];

  // Role filter: If member, strictly show member's tasks
  if (state.currentUser !== 'manager') {
    list = list.filter(t => t.assigneeId === state.currentUser);
  } else {
    // If manager, check filter dropdown
    if (state.filters.member !== 'all') {
      list = list.filter(t => t.assigneeId === state.filters.member);
    }
  }

  // Priority filter
  if (state.filters.priority !== 'all') {
    list = list.filter(t => t.priority === state.filters.priority);
  }

  // Deadline filter
  if (state.filters.deadline !== 'all') {
    list = list.filter(t => {
      const info = getDeadlineInfo(t.deadline, t.status === 'done');
      if (state.filters.deadline === 'overdue') return info.isOverdue;
      if (state.filters.deadline === 'today') return info.status === 'today';
      if (state.filters.deadline === 'week') {
        const [y, m, d] = t.deadline.split('-').map(Number);
        const target = new Date(y, m - 1, d);
        const diff = Math.round((target - new Date()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 7;
      }
      return true;
    });
  }

  // Search keyword
  if (state.filters.search.trim()) {
    const q = state.filters.search.toLowerCase().trim();
    list = list.filter(t => {
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const assignee = getMemberById(t.assigneeId);
      const matchAssignee = assignee.name.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchAssignee;
    });
  }

  return list;
}

function renderKanbanBoard() {
  const filteredTasks = getFilteredTasks();
  const statuses = ['todo', 'in_progress', 'review', 'done'];

  statuses.forEach(status => {
    const container = document.getElementById(`column-${status}`);
    const countEl = document.getElementById(`count-${status}`);
    const statusTasks = filteredTasks.filter(t => t.status === status);

    countEl.textContent = statusTasks.length;
    container.innerHTML = '';

    if (statusTasks.length === 0) {
      container.innerHTML = `
        <div class="h-28 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white/40">
          <i data-lucide="inbox" class="w-5 h-5 mb-1 opacity-50"></i>
          <span>ไม่มีงานในสถานะนี้</span>
        </div>
      `;
      return;
    }

    statusTasks.forEach(task => {
      const card = createKanbanCard(task);
      container.appendChild(card);
    });
  });

  setupDragAndDropEvents();
}

function createKanbanCard(task) {
  const card = document.createElement('div');
  card.className = 'kanban-card bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300 relative group';
  card.setAttribute('draggable', 'true');
  card.setAttribute('data-id', task.id);

  const assignee = getMemberById(task.assigneeId);
  const isDone = task.status === 'done';
  const deadlineInfo = getDeadlineInfo(task.deadline, isDone);

  // Deadline badge style
  let deadlineBadgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
  if (deadlineInfo.isOverdue) {
    deadlineBadgeClass = 'bg-rose-50 text-rose-600 border-rose-200 font-semibold animate-pulse-urgent';
  } else if (deadlineInfo.status === 'today') {
    deadlineBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
  } else if (isDone) {
    deadlineBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  card.innerHTML = `
    <!-- Top Row: Priority & Quick Move Dropdown -->
    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="flex items-center gap-1.5 flex-wrap">
        ${getPriorityBadgeHtml(task.priority)}
        <span class="text-[10px] text-slate-400">#${task.id.replace('task-', '')}</span>
      </div>
      
      <!-- Quick Status Switch for touch/click -->
      <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100">
        <button class="btn-move-left p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded" title="ย้ายไปสถานะก่อนหน้า">
          <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
        </button>
        <button class="btn-move-right p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded" title="ย้ายไปสถานะถัดไป">
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>

    <!-- Task Title -->
    <h4 class="text-xs sm:text-sm font-bold text-slate-800 leading-snug mb-1.5 group-hover:text-indigo-600 transition cursor-pointer card-title-clickable">
      ${task.title}
    </h4>

    <!-- Task Description Preview -->
    ${task.description ? `<p class="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">${task.description}</p>` : ''}

    <!-- Dates Information -->
    <div class="space-y-1 mb-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-1 text-slate-400">
          <i data-lucide="calendar" class="w-3 h-3"></i> เริ่ม:
        </span>
        <span class="text-slate-600">${formatThaiDate(task.startDate)}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-1 text-slate-400">
          <i data-lucide="clock" class="w-3 h-3"></i> กำหนดส่ง:
        </span>
        <span class="px-1.5 py-0.5 rounded text-[10px] border ${deadlineBadgeClass}">
          ${deadlineInfo.label} (${deadlineInfo.badgeText})
        </span>
      </div>
    </div>

    <!-- Bottom Row: Assignee & Quick Edit -->
    <div class="flex items-center justify-between pt-2 border-t border-slate-100">
      <div class="flex items-center gap-1.5" title="${assignee.name} (${assignee.role})">
        <span class="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs">
          ${assignee.avatar}
        </span>
        <span class="text-xs text-slate-700 font-medium truncate max-w-[110px]">
          ${assignee.name}
        </span>
      </div>

      <button class="btn-card-edit text-xs text-slate-400 hover:text-indigo-600 p-1 hover:bg-slate-100 rounded-lg flex items-center gap-0.5" title="แก้ไขงาน">
        <i data-lucide="more-horizontal" class="w-4 h-4"></i>
      </button>
    </div>
  `;

  // Attach card click handlers
  card.querySelector('.card-title-clickable').addEventListener('click', () => openTaskModal(task.id));
  card.querySelector('.btn-card-edit').addEventListener('click', (e) => {
    e.stopPropagation();
    openTaskModal(task.id);
  });

  // Step movement buttons
  const statuses = ['todo', 'in_progress', 'review', 'done'];
  const currentIndex = statuses.indexOf(task.status);

  const btnLeft = card.querySelector('.btn-move-left');
  const btnRight = card.querySelector('.btn-move-right');

  if (currentIndex === 0) {
    btnLeft.disabled = true;
    btnLeft.classList.add('opacity-30', 'cursor-not-allowed');
  } else {
    btnLeft.addEventListener('click', (e) => {
      e.stopPropagation();
      moveTaskStatus(task.id, statuses[currentIndex - 1]);
    });
  }

  if (currentIndex === statuses.length - 1) {
    btnRight.disabled = true;
    btnRight.classList.add('opacity-30', 'cursor-not-allowed');
  } else {
    btnRight.addEventListener('click', (e) => {
      e.stopPropagation();
      moveTaskStatus(task.id, statuses[currentIndex + 1]);
    });
  }

  return card;
}

function renderTableView() {
  const tableRows = document.getElementById('table-rows');
  const filteredTasks = getFilteredTasks();

  if (filteredTasks.length === 0) {
    tableRows.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-slate-400">
          <i data-lucide="folder-x" class="w-6 h-6 mx-auto mb-1 opacity-50"></i>
          ไม่พบข้อมูลงานตามเงื่อนไขที่เลือก
        </td>
      </tr>
    `;
    return;
  }

  tableRows.innerHTML = '';
  filteredTasks.forEach(task => {
    const assignee = getMemberById(task.assigneeId);
    const deadlineInfo = getDeadlineInfo(task.deadline, task.status === 'done');

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';

    tr.innerHTML = `
      <td class="py-3 px-4">
        <div class="font-bold text-slate-800">${task.title}</div>
        <div class="text-[11px] text-slate-400 line-clamp-1">${task.description || '-'}</div>
      </td>
      <td class="py-3 px-4 whitespace-nowrap">
        <div class="flex items-center gap-1.5">
          <span>${assignee.avatar}</span>
          <span class="font-medium text-slate-700">${assignee.name}</span>
        </div>
      </td>
      <td class="py-3 px-4 text-slate-600 whitespace-nowrap">${formatThaiDate(task.startDate)}</td>
      <td class="py-3 px-4 whitespace-nowrap">
        <span class="${deadlineInfo.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}">
          ${formatThaiDate(task.deadline)}
        </span>
        <span class="block text-[10px] text-slate-400">${deadlineInfo.badgeText}</span>
      </td>
      <td class="py-3 px-4 whitespace-nowrap">${getPriorityBadgeHtml(task.priority)}</td>
      <td class="py-3 px-4 whitespace-nowrap">${getStatusBadgeHtml(task.status)}</td>
      <td class="py-3 px-4 text-center whitespace-nowrap">
        <button class="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition" onclick="openTaskModal('${task.id}')">
          แก้ไข
        </button>
      </td>
    `;
    tableRows.appendChild(tr);
  });
}

/* ========================================================
   DRAG AND DROP HANDLERS (Native HTML5 API)
   ======================================================== */

function setupDragAndDropEvents() {
  const cards = document.querySelectorAll('.kanban-card');
  const columns = document.querySelectorAll('.cards-container');

  cards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  });

  columns.forEach(col => {
    col.addEventListener('dragover', handleDragOver);
    col.addEventListener('dragleave', handleDragLeave);
    col.addEventListener('drop', handleDrop);
  });
}

function handleDragStart(e) {
  state.draggedTaskId = this.getAttribute('data-id');
  this.classList.add('is-dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', state.draggedTaskId);
}

function handleDragEnd() {
  this.classList.remove('is-dragging');
  document.querySelectorAll('.cards-container').forEach(c => c.classList.remove('drag-over'));
  state.draggedTaskId = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('drag-over');
}

function handleDragLeave() {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  const taskId = e.dataTransfer.getData('text/plain') || state.draggedTaskId;
  const targetStatus = this.parentElement.getAttribute('data-status');

  if (taskId && targetStatus) {
    moveTaskStatus(taskId, targetStatus);
  }
}

function moveTaskStatus(taskId, targetStatus) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task && task.status !== targetStatus) {
    task.status = targetStatus;
    saveData();
    renderApp();
    const statusTitles = {
      todo: 'To Do (รอดำเนินการ)',
      in_progress: 'In Progress (กำลังทำ)',
      review: 'Review (รอตรวจ)',
      done: 'Done (เสร็จสิ้น)'
    };
    showToast(`ย้ายงานไปยัง: ${statusTitles[targetStatus]}`);
  }
}

/* ========================================================
   MODAL: CREATE / EDIT TASK
   ======================================================== */

function openTaskModal(taskId = null, defaultStatus = 'todo') {
  const modal = document.getElementById('modal-task');
  const modalTitle = document.getElementById('modal-task-title');
  const form = document.getElementById('form-task');
  const btnDelete = document.getElementById('btn-delete-task');

  form.reset();

  if (taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    modalTitle.textContent = 'แก้ไขรายละเอียดงาน (Edit Task)';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-name').value = task.title;
    document.getElementById('task-desc').value = task.description || '';
    document.getElementById('task-assignee').value = task.assigneeId;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-date').value = task.startDate;
    document.getElementById('task-deadline').value = task.deadline;
    document.getElementById('task-status').value = task.status;

    btnDelete.classList.remove('hidden');
    btnDelete.onclick = () => deleteTask(task.id);
  } else {
    modalTitle.textContent = 'สร้างงานใหม่ (New Task)';
    document.getElementById('task-id').value = '';
    
    // Assignee default logic
    if (state.currentUser !== 'manager') {
      document.getElementById('task-assignee').value = state.currentUser;
    } else {
      document.getElementById('task-assignee').value = state.members[0]?.id || '';
    }

    document.getElementById('task-priority').value = 'medium';
    document.getElementById('task-date').value = getDateOffset(0);
    document.getElementById('task-deadline').value = getDateOffset(3);
    document.getElementById('task-status').value = defaultStatus;

    btnDelete.classList.add('hidden');
  }

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeTaskModal() {
  document.getElementById('modal-task').classList.add('hidden');
}

function handleSaveTask(e) {
  e.preventDefault();
  const taskId = document.getElementById('task-id').value;
  const title = document.getElementById('task-name').value.trim();
  const description = document.getElementById('task-desc').value.trim();
  const assigneeId = document.getElementById('task-assignee').value;
  const priority = document.getElementById('task-priority').value;
  const startDate = document.getElementById('task-date').value;
  const deadline = document.getElementById('task-deadline').value;
  const status = document.getElementById('task-status').value;

  if (!title || !assigneeId || !startDate || !deadline) {
    alert('กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน');
    return;
  }

  if (taskId) {
    // Edit existing task
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task.title = title;
      task.description = description;
      task.assigneeId = assigneeId;
      task.priority = priority;
      task.startDate = startDate;
      task.deadline = deadline;
      task.status = status;
      showToast('อัปเดตงานเรียบร้อยแล้ว');
    }
  } else {
    // Create new task
    const newTask = {
      id: 'task-' + Date.now(),
      title,
      description,
      assigneeId,
      priority,
      startDate,
      deadline,
      status,
      createdAt: Date.now()
    };
    state.tasks.unshift(newTask);
    showToast('สร้างงานใหม่เรียบร้อยแล้ว');
  }

  saveData();
  closeTaskModal();
  renderApp();
}

function deleteTask(taskId) {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบงานนี้ออกจากระบบ?')) {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    saveData();
    closeTaskModal();
    renderApp();
    showToast('ลบงานสำเร็จ');
  }
}

/* ========================================================
   MODAL: MEMBERS MANAGEMENT
   ======================================================== */

function openMembersModal() {
  renderMembersList();
  document.getElementById('modal-members').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeMembersModal() {
  document.getElementById('modal-members').classList.add('hidden');
}

function renderMembersList() {
  const container = document.getElementById('members-list-container');
  container.innerHTML = '';

  state.members.forEach(member => {
    const taskCount = state.tasks.filter(t => t.assigneeId === member.id).length;
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs';

    row.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-base">${member.avatar}</span>
        <div>
          <span class="font-bold text-slate-800">${member.name}</span>
          <span class="text-slate-400 block">${member.role} (${taskCount} งาน)</span>
        </div>
      </div>
      <button class="btn-del-member text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50" title="ลบสมาชิก">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    `;

    row.querySelector('.btn-del-member').onclick = () => {
      if (state.members.length <= 1) {
        alert('ต้องมีสมาชิกในทีมอย่างน้อย 1 คน');
        return;
      }
      if (confirm(`คุณต้องการลบ "${member.name}" ออกจากระบบใช่หรือไม่?`)) {
        state.members = state.members.filter(m => m.id !== member.id);
        if (state.currentUser === member.id) {
          state.currentUser = 'manager';
        }
        saveData();
        renderMembersList();
        renderApp();
        showToast(`ลบ ${member.name} เรียบร้อย`);
      }
    };

    container.appendChild(row);
  });
}

function handleAddMember(e) {
  e.preventDefault();
  const nameInput = document.getElementById('new-member-name');
  const roleInput = document.getElementById('new-member-role');

  const name = nameInput.value.trim();
  const role = roleInput.value.trim() || 'Team Member';

  if (!name) return;

  const avatars = ['🧑‍💻', '👩‍💻', '👨‍🎨', '👩‍🔬', '🧙‍♂️', '🦸‍♀️', '🧑‍🚀', '✨'];
  const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

  const newMember = {
    id: 'mem-' + Date.now(),
    name,
    role,
    avatar: randomAvatar,
    color: 'indigo'
  };

  state.members.push(newMember);
  saveData();

  nameInput.value = '';
  roleInput.value = '';
  renderMembersList();
  renderApp();
  showToast(`เพิ่มสมาชิก "${name}" สำเร็จ`);
}

/* ========================================================
   DATA BACKUP & DEMO RESET
   ======================================================== */

function exportData() {
  const data = {
    members: state.members,
    tasks: state.tasks,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `teamflow-backup-${getDateOffset(0)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('ดาวน์โหลดไฟล์สำรองข้อมูล JSON สำเร็จ');
}

function handleImportData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const data = JSON.parse(event.target.result);
      if (Array.isArray(data.members) && Array.isArray(data.tasks)) {
        state.members = data.members;
        state.tasks = data.tasks;
        saveData();
        renderApp();
        showToast('นำเข้าข้อมูลสำเร็จ');
      } else {
        alert('ไฟล์ข้อมูลไม่ถูกต้องตามโครงสร้างของ TeamFlow');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function resetToDemo() {
  if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นข้อมูลตัวอย่างตั้งต้นใช่หรือไม่? ข้อมูลปัจจุบันที่สร้างจะถูกแทนที่')) {
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    state.currentUser = 'manager';
    loadData();
    renderApp();
    showToast('รีเซ็ตเป็นข้อมูลตัวอย่างเรียบร้อยแล้ว');
  }
}

/* ========================================================
   EVENT LISTENERS SETUP
   ======================================================== */

function setupEventListeners() {
  // Role / User Switcher
  document.getElementById('user-selector').addEventListener('change', (e) => {
    state.currentUser = e.target.value;
    state.filters.member = 'all'; // reset filter
    saveData();
    renderApp();
    showToast(state.currentUser === 'manager' ? 'เข้าสู่โหมดภาพรวมหัวหน้างาน' : 'เข้าสู่โหมดบอร์ดส่วนตัวของสมาชิก');
  });

  // Filter events
  document.getElementById('filter-member').addEventListener('change', (e) => {
    state.filters.member = e.target.value;
    renderKanbanBoard();
    renderTableView();
  });

  document.getElementById('filter-priority').addEventListener('change', (e) => {
    state.filters.priority = e.target.value;
    renderKanbanBoard();
    renderTableView();
  });

  document.getElementById('filter-deadline').addEventListener('change', (e) => {
    state.filters.deadline = e.target.value;
    renderKanbanBoard();
    renderTableView();
  });

  document.getElementById('search-input').addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    renderKanbanBoard();
    renderTableView();
  });

  // View Switch (Kanban vs Table)
  const btnKanban = document.getElementById('view-mode-kanban');
  const btnTable = document.getElementById('view-mode-table');
  const kanbanSec = document.getElementById('kanban-section');
  const tableSec = document.getElementById('table-section');

  btnKanban.addEventListener('click', () => {
    btnKanban.className = 'px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white shadow-xs flex items-center gap-1';
    btnTable.className = 'px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-1';
    kanbanSec.classList.remove('hidden');
    tableSec.classList.add('hidden');
    state.viewMode = 'kanban';
  });

  btnTable.addEventListener('click', () => {
    btnTable.className = 'px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white shadow-xs flex items-center gap-1';
    btnKanban.className = 'px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-1';
    tableSec.classList.remove('hidden');
    kanbanSec.classList.add('hidden');
    state.viewMode = 'table';
    renderTableView();
    if (window.lucide) lucide.createIcons();
  });

  // Modals & Forms
  document.getElementById('btn-open-create-task').addEventListener('click', () => openTaskModal());
  document.getElementById('btn-close-task-modal').addEventListener('click', closeTaskModal);
  document.getElementById('btn-cancel-task').addEventListener('click', closeTaskModal);
  document.getElementById('form-task').addEventListener('submit', handleSaveTask);

  // Quick add in columns
  document.querySelectorAll('.btn-quick-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const colStatus = btn.getAttribute('data-status');
      openTaskModal(null, colStatus);
    });
  });

  // Drawer / Options panel
  const optionsPanel = document.getElementById('options-panel');
  document.getElementById('btn-toggle-options').addEventListener('click', () => {
    optionsPanel.classList.toggle('hidden');
  });

  // Members Modal
  document.getElementById('btn-add-member').addEventListener('click', openMembersModal);
  document.getElementById('btn-manage-members').addEventListener('click', openMembersModal);
  document.getElementById('btn-close-members-modal').addEventListener('click', closeMembersModal);
  document.getElementById('form-add-member').addEventListener('submit', handleAddMember);

  // Backup / Reset
  document.getElementById('btn-export-data').addEventListener('click', exportData);
  document.getElementById('btn-import-data-trigger').addEventListener('click', () => {
    document.getElementById('file-import-input').click();
  });
  document.getElementById('file-import-input').addEventListener('change', handleImportData);
  document.getElementById('btn-reset-demo').addEventListener('click', resetToDemo);

  // Global ESC key to close modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTaskModal();
      closeMembersModal();
    }
  });
}

// Start Application on DOM Ready
document.addEventListener('DOMContentLoaded', initApp);
