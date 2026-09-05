let currentDate = new Date(); // 달력에서 보여주는 기준 월
let selectedDate = new Date(); // 유저가 선택한 특정 날짜
let currentTodos = []; // 현재 선택된 날짜의 할 일 목록

// 실제 시스템의 오늘 날짜 (미래 판단 및 하이라이트용, 시간은 자정으로 초기화)
const realToday = new Date();
realToday.setHours(0, 0, 0, 0);

// 접속 시 오늘 날짜를 기본 선택 상태로 초기화
currentDate = new Date();
selectedDate = new Date();
selectedDate.setHours(0, 0, 0, 0);

document.addEventListener('DOMContentLoaded', () => {
    initCalendar();
    renderCalendar();
    loadAndRenderTodos();
});

// --- API 통신 함수 ---

const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const fetchTodos = async (targetDate) => {
    const response = await fetch(`/api/todos?date=${targetDate}`);
    if (!response.ok) throw new Error('할 일 조회 실패');
    const result = await response.json();
    return result.todos;
};

const addTodo = async (title, targetDate) => {
    const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, targetDate }),
    });
    if (!response.ok) throw new Error('할 일 추가 실패');
    const result = await response.json();
    return result.todo;
};

const editTodo = async (id, title) => {
    const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error('할 일 수정 실패');
    const result = await response.json();
    return result.todo;
};

const toggleTodo = async (id) => {
    const response = await fetch(`/api/todos/${id}/toggle`, {
        method: 'PATCH',
    });
    if (!response.ok) throw new Error('할 일 상태 변경 실패');
    const result = await response.json();
    return result.todo;
};

const removeTodo = async (id) => {
    const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('할 일 삭제 실패');
};

// --- 데이터 로드 및 렌더링 ---

const loadAndRenderTodos = async () => {
    const dateKey = formatDateKey(selectedDate);
    try {
        currentTodos = await fetchTodos(dateKey);
    } catch (error) {
        console.error('할 일 로드 실패:', error);
        currentTodos = [];
    }
    renderTodoList();
};

// --- 달력 ---

function initCalendar() {
    document.getElementById('prev-month-btn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('next-month-btn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    document.getElementById('add-todo-btn').addEventListener('click', async () => {
        const newTitle = await AppDialog.prompt('새로운 할 일을 입력하세요:');
        if (newTitle && newTitle.trim() !== '') {
            try {
                const dateKey = formatDateKey(selectedDate);
                await addTodo(newTitle.trim(), dateKey);
                await loadAndRenderTodos();
                renderCalendar();
            } catch (error) {
                console.error('할 일 추가 실패:', error);
                AppDialog.alert('할 일 추가에 실패했습니다.');
            }
        }
    });
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    document.getElementById('current-month-label').textContent = `${year}년 ${month + 1}월`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();

    const daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = '';

    // 달력 셀을 그리는 헬퍼 함수
    const createDayBtn = (dYear, dMonth, dDate, isMuted) => {
        const btn = document.createElement('button');
        btn.className = 'calendar-day-btn' + (isMuted ? ' muted' : '');
        btn.textContent = dDate;

        // 요일 색상 지정
        const dayOfWeek = new Date(dYear, dMonth, dDate).getDay();
        if (dayOfWeek === 0) btn.classList.add('sun');
        if (dayOfWeek === 6) btn.classList.add('sat');

        // 선택된 날짜
        if (selectedDate.getFullYear() === dYear && selectedDate.getMonth() === dMonth && selectedDate.getDate() === dDate) {
            btn.classList.add('selected');
        }

        // 실제 오늘 날짜 표시 (.today 클래스)
        if (realToday.getFullYear() === dYear && realToday.getMonth() === dMonth && realToday.getDate() === dDate) {
            btn.classList.add('today');
        }

        btn.addEventListener('click', () => {
            currentDate.setFullYear(dYear, dMonth, 1);
            selectedDate = new Date(dYear, dMonth, dDate);
            renderCalendar();
            loadAndRenderTodos();
        });

        return btn;
    };

    // 이전 달
    for (let i = firstDayIndex; i > 0; i--) {
        daysContainer.appendChild(createDayBtn(year, month - 1, prevLastDate - i + 1, true));
    }

    // 이번 달
    for (let i = 1; i <= lastDate; i++) {
        daysContainer.appendChild(createDayBtn(year, month, i, false));
    }

    // 다음 달
    const remainingCells = 42 - (firstDayIndex + lastDate); 
    for (let i = 1; i <= remainingCells; i++) {
        daysContainer.appendChild(createDayBtn(year, month + 1, i, true));
    }
}

// --- 할 일 목록 렌더링 ---

function renderTodoList() {
    const title = document.getElementById('todo-date-title');
    const statusLabel = document.getElementById('todo-status-label');
    const listContainer = document.getElementById('todo-list');

    title.textContent = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 할일`;

    const todos = currentTodos;

    if (todos.length === 0) {
        statusLabel.textContent = '0/0 완료';
        listContainer.innerHTML = `<div style="text-align: center; color: var(--color-primary-light); padding: 20px; font-size: 14px;">등록된 할 일이 없습니다.</div>`;
        return;
    }

    const completedCount = todos.filter(t => t.is_completed).length;
    statusLabel.textContent = `${completedCount}/${todos.length} 완료`;

    listContainer.innerHTML = '';

    // 미래 날짜 판단 (시간 0시 기준으로 비교)
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const isFuture = selectedDateOnly > realToday;

    todos.forEach((todo) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'todo-item' + (todo.is_completed ? ' completed' : '');

        // 체크 버튼 영역
        const checkBtn = document.createElement('button');
        checkBtn.className = 'todo-check';
        checkBtn.innerHTML = '<svg viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        
        // 텍스트 영역
        const textSpan = document.createElement('span');
        textSpan.className = 'todo-text';
        textSpan.textContent = todo.title;

        itemDiv.appendChild(checkBtn);
        itemDiv.appendChild(textSpan);

        // 수정/삭제 버튼 영역
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'todo-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'todo-action-btn';
        editBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
        editBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const newTitle = await AppDialog.prompt('할 일을 수정하세요:', todo.title);
            if (newTitle !== null && newTitle.trim() !== '') {
                try {
                    await editTodo(todo.id, newTitle.trim());
                    await loadAndRenderTodos();
                } catch (error) {
                    console.error('할 일 수정 실패:', error);
                    AppDialog.alert('할 일 수정에 실패했습니다.');
                }
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'todo-action-btn';
        deleteBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (await AppDialog.confirm(`'${todo.title}'을(를) 삭제하시겠습니까?`)) {
                try {
                    await removeTodo(todo.id);
                    await loadAndRenderTodos();
                    renderCalendar();
                } catch (error) {
                    console.error('할 일 삭제 실패:', error);
                    AppDialog.alert('할 일 삭제에 실패했습니다.');
                }
            }
        });

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        itemDiv.appendChild(actionsDiv);

        // 항목 클릭 시 완료 상태 토글
        itemDiv.addEventListener('click', async () => {
            if (isFuture) {
                AppDialog.alert('미래에 해야할 일은 미리 완료할 수 없습니다.');
                return;
            }
            try {
                await toggleTodo(todo.id);
                await loadAndRenderTodos();
            } catch (error) {
                console.error('할 일 상태 변경 실패:', error);
                AppDialog.alert('상태 변경에 실패했습니다.');
            }
        });

        listContainer.appendChild(itemDiv);
    });
}
