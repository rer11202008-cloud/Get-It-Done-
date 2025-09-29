document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const emptyImage = document.querySelector('.empty-image');
    const progressBar = document.getElementById('progress');
    const numbers = document.getElementById('numbers');
    const statContainer = document.getElementById('stat-container');

    function toggleStatContainer() {
        const totalTasks = taskList.children.length;
        const completedTasks = taskList.querySelectorAll('.task-checkbox:checked').length;
        if (totalTasks === 0 || (totalTasks > 0 && completedTasks === totalTasks)) {
            statContainer.style.display = 'none';
        } else {
            statContainer.style.display = 'flex';
        }
    }

    function toggleEmptyState() {
        emptyImage.style.display = taskList.children.length === 0 ? 'block' : 'none';
        toggleStatContainer();
    }

    const updateprogress = (checkcompletion = true) => {
        const totalTasks = taskList.children.length;
        const completedTasks = taskList.querySelectorAll('.task-checkbox:checked').length;

        progressBar.style.width = totalTasks ? `${(completedTasks / totalTasks) * 100}%` : '0%';
        numbers.textContent = `${completedTasks} / ${totalTasks}`;

        toggleStatContainer();

        if (checkcompletion && totalTasks > 0 && completedTasks === totalTasks) {
            Confetti();
         }
    };

    // History modal logic
    const historyLink = document.getElementById('history-link');
    const historyModal = document.getElementById('history-modal');
    const closeHistory = document.getElementById('close-history');
    const historyList = document.getElementById('history-list');

    function showModal(modal) {
        modal.style.display = 'block';
    }
    function hideModal(modal) {
        modal.style.display = 'none';
    }

    historyLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderHistory();
        showModal(historyModal);
    });
    closeHistory.addEventListener('click', () => hideModal(historyModal));
    window.addEventListener('click', (e) => {
        if (e.target === historyModal) hideModal(historyModal);
        if (e.target === registerModal) hideModal(registerModal);
        if (e.target === loginModal) hideModal(loginModal);
    });

    function getHistory() {
        return JSON.parse(localStorage.getItem('history') || '[]');
    }
    function setHistory(history) {
        localStorage.setItem('history', JSON.stringify(history));
    }
    function addHistoryEntry(entry) {
        const history = getHistory();
        history.unshift(entry);
        setHistory(history);
    }
    function renderHistory() {
        const history = getHistory();
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<li>No history yet.</li>';
            return;
        }
        history.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${escapeHtml(item.text)}</strong><br>
                <small>Added: ${item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</small><br>
                <small>Completed: ${item.completedAt ? new Date(item.completedAt).toLocaleString() : '-'}</small>`;
            historyList.appendChild(li);
        });
    }

    const savetasktolocalstorage = () => {
        const tasks = Array.from(taskList.querySelectorAll('li')).map(li => {
            return {
                text: li.querySelector('.task-text').textContent,
                completed: li.querySelector('.task-checkbox').checked,
                createdAt: li.dataset.createdAt || null,
                completedAt: li.dataset.completedAt || null
            };
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    const loadTasksFromLocalStorage = () => {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks.forEach(task => {
            const listItem = createListItem(task.text, task.completed, task.createdAt, task.completedAt);
            taskList.appendChild(listItem);
        });
        toggleEmptyState();
        updateprogress(true);
    };

    function createListItem(text, completed = false, createdAt = null, completedAt = null) {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <label class="task-row">
                <input type="checkbox" class="task-checkbox"/>
                <span class="task-text">${escapeHtml(text)}</span>
            </label>
            <div class="task-buttons">
                <button type="button" class="edit-btn" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="delete-btn" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        const checkbox = listItem.querySelector('.task-checkbox');
        const textSpan = listItem.querySelector('.task-text');
        // Set creation time if not present
        listItem.dataset.createdAt = createdAt || new Date().toISOString();
        listItem.dataset.completedAt = completed ? (completedAt || new Date().toISOString()) : '';

        checkbox.checked = completed;
        textSpan.style.textDecoration = checkbox.checked ? 'line-through' : 'none';

        checkbox.addEventListener('change', () => {
            textSpan.style.textDecoration = checkbox.checked ? 'line-through' : 'none';
            if (checkbox.checked) {
                listItem.dataset.completedAt = new Date().toISOString();
                addHistoryEntry({
                    text: textSpan.textContent,
                    createdAt: listItem.dataset.createdAt,
                    completedAt: listItem.dataset.completedAt
                });
            } else {
                listItem.dataset.completedAt = '';
            }
            updateprogress(true);
            savetasktolocalstorage();
        });

        listItem.querySelector('.edit-btn').addEventListener('click', () => {
            if (!checkbox.checked) {
                taskInput.value = textSpan.textContent;
                taskInput.focus();
                listItem.remove();
                toggleEmptyState();
                updateprogress(true);
                savetasktolocalstorage();
            }
        });

        listItem.querySelector('.delete-btn').addEventListener('click', () => {
            listItem.remove();
            toggleEmptyState();
            updateprogress(true);
            savetasktolocalstorage();
        });

        return listItem;
    }

    function addTask(event, checkcompletion = true) {
        event.preventDefault(); // prevent form submit reload
        const taskText = taskInput.value.trim();
        if (!taskText) return;
        const now = new Date().toISOString();
        const listItem = createListItem(taskText, false, now, '');
        taskList.appendChild(listItem);
        // Add to history as "added" (without completedAt)
        addHistoryEntry({
            text: taskText,
            createdAt: now,
            completedAt: null
        });
        taskInput.value = '';
        toggleEmptyState();
        updateprogress(checkcompletion);
        savetasktolocalstorage();
    }

    // simple escape to avoid accidental HTML injection when using innerHTML
    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    form.addEventListener('submit', (e) => addTask(e, true));
    loadTasksFromLocalStorage();
    toggleEmptyState(); // set initial empty-image state
    updateprogress(true); // set initial progress state

    // Confetti function (fixed)
    function Confetti() {
        const end = Date.now() + 15 * 1000;
        const colors = ["#002cbbff", "#ffffff"];
        (function frame() {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors,
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors,
            });
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();
    }

    // Navbar & Modal logic
    const registerLink = document.getElementById('register-link');
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const registerModal = document.getElementById('register-modal');
    const loginModal = document.getElementById('login-modal');
    const closeRegister = document.getElementById('close-register');
    const closeLogin = document.getElementById('close-login');
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const registerMessage = document.getElementById('register-message');
    const loginMessage = document.getElementById('login-message');

    function showModal(modal) {
        modal.style.display = 'block';
    }
    function hideModal(modal) {
        modal.style.display = 'none';
    }

    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        showModal(registerModal);
    });
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showModal(loginModal);
    });
    closeRegister.addEventListener('click', () => hideModal(registerModal));
    closeLogin.addEventListener('click', () => hideModal(loginModal));
    window.addEventListener('click', (e) => {
        if (e.target === registerModal) hideModal(registerModal);
        if (e.target === loginModal) hideModal(loginModal);
    });

    // Simple localStorage-based user system (for demo only)
    function getUsers() {
        return JSON.parse(localStorage.getItem('users') || '{}');
    }
    function setUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    }
    function setLoggedInUser(username) {
        localStorage.setItem('loggedInUser', username);
    }
    function getLoggedInUser() {
        return localStorage.getItem('loggedInUser');
    }
    function logoutUser() {
        localStorage.removeItem('loggedInUser');
        updateNavbar();
    }

    function updateNavbar() {
        const user = getLoggedInUser();
        if (user) {
            loginLink.style.display = 'none';
            registerLink.style.display = 'none';
            logoutLink.style.display = 'inline';
        } else {
            loginLink.style.display = 'inline';
            registerLink.style.display = 'inline';
            logoutLink.style.display = 'none';
        }
    }

    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        if (!username || !password) {
            registerMessage.textContent = 'Please fill in all fields.';
            return;
        }
        let users = getUsers();
        if (users[username]) {
            registerMessage.textContent = 'Username already exists.';
            return;
        }
        users[username] = password;
        setUsers(users);
        registerMessage.textContent = 'Registration successful! You can now login.';
        setTimeout(() => {
            hideModal(registerModal);
            registerMessage.textContent = '';
        }, 1000);
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        let users = getUsers();
        if (users[username] && users[username] === password) {
            setLoggedInUser(username);
            loginMessage.textContent = 'Login successful!';
            updateNavbar();
            setTimeout(() => {
                hideModal(loginModal);
                loginMessage.textContent = '';
            }, 1000);
        } else {
            loginMessage.textContent = 'Invalid username or password.';
        }
    });

    updateNavbar();
});