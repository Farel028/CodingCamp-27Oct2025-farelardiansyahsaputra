// --- Data ---
let todos = [];
let editingIndex = null;

// Filter state
let filterStatus = "all"; // all | active | completed
let filterDue = "all"; // all | overdue | today | upcoming
let filterSearch = "";

// --- Validation ---
function validateForm(todo, date) {
  return !(todo.trim() === "" || date === "");
}

// --- Add / Edit switch by submit ---
function addTodo() {
  const todoInputEl = document.getElementById("todo-input");
  const todoDateEl = document.getElementById("todo-date");

  const task = todoInputEl.value;
  const due = todoDateEl.value;

  if (!validateForm(task, due)) {
    alert("Form validation failed. Please check your inputs.");
    return;
  }

  todos.push({ task: task.trim(), dueDate: due, done: false });
  renderTodos();
  resetForm();
}

// --- Edit ---
function startEdit(index) {
  const item = getFiltered()[index];
  if (!item) return;

  const originalIndex = todos.indexOf(item);
  if (originalIndex === -1) return;
  editingIndex = originalIndex;

  const todoInputEl = document.getElementById("todo-input");
  const todoDateEl = document.getElementById("todo-date");
  const addBtn = document.getElementById("add-todo-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  const editHint = document.getElementById("edit-hint");

  todoInputEl.value = item.task;
  todoDateEl.value = item.dueDate || "";

  addBtn.textContent = "Save";
  addBtn.classList.remove(
    "bg-teal-500",
    "hover:bg-teal-600",
    "active:bg-teal-700"
  );
  addBtn.classList.add(
    "bg-blue-600",
    "hover:bg-blue-700",
    "active:bg-blue-800"
  );
  cancelBtn.classList.remove("hidden");
  editHint.classList.remove("hidden");

  todoInputEl.focus();
}

// -- Update ---
function updateTodo() {
  const todoInputEl = document.getElementById("todo-input");
  const todoDateEl = document.getElementById("todo-date");

  const task = todoInputEl.value;
  const due = todoDateEl.value;

  if (!validateForm(task, due)) {
    alert("Form validation failed. Please check your inputs.");
    return;
  }

  if (editingIndex === null || !todos[editingIndex]) {
    addTodo();
    return;
  }

  const old = todos[editingIndex];
  todos[editingIndex] = { task: task.trim(), dueDate: due, done: old.done };
  renderTodos();
  resetForm();
}

// --- Complete toggle ---
function toggleDone(indexInFiltered) {
  const item = getFiltered()[indexInFiltered];
  if (!item) return;
  const originalIndex = todos.indexOf(item);
  if (originalIndex === -1) return;

  todos[originalIndex].done = !todos[originalIndex].done;
  renderTodos();
}

// --- Delete / Clear ---
function deleteTodo(indexInFiltered) {
  const item = getFiltered()[indexInFiltered];
  if (!item) return;
  const originalIndex = todos.indexOf(item);
  if (originalIndex === -1) return;

  if (editingIndex === originalIndex) resetForm();
  todos.splice(originalIndex, 1);
  renderTodos();
}

function clearAllTodos() {
  if (!todos.length) return;
  if (confirm("Clear all todos?")) {
    todos = [];
    renderTodos();
    resetForm();
  }
}

// --- Filter ---
function applyFilters(list) {
  return list
    .filter((t) => {
      // filter status
      if (filterStatus === "active" && t.done) return false;
      if (filterStatus === "completed" && !t.done) return false;
      return true;
    })
    .filter((t) => {
      // filter due
      if (filterDue === "all") return true;
      const when = dueWhen(t.dueDate);
      return when === filterDue;
    })
    .filter((t) => {
      // search text
      if (!filterSearch.trim()) return true;
      return t.task.toLowerCase().includes(filterSearch.trim().toLowerCase());
    });
}

function getFiltered() {
  return applyFilters(todos);
}

// --- Render ---
function renderTodos() {
  const tbody = document.getElementById("todo-tbody");
  const list = getFiltered();

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="p-6 text-center text-slate-500">
          No todos match your filter — adjust filters or add new todo.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((todo, i) => {
      const rowText = todo.done ? "line-through text-slate-400" : "";
      const dateText = formatDate(todo.dueDate);
      const badge = getDueBadge(todo);

      return `
        <tr class="hover:bg-teal-50 transition">
          <td class="p-3 border-b ${rowText}">${todo.task}</td>
          <td class="p-3 border-b ${rowText}">${dateText}</td>
          <td class="p-3 border-b">
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                ${todo.done ? "checked" : ""}
                class="h-4 w-4 accent-teal-600"
                onchange="toggleDone(${i})"
              />
              ${badge}
            </div>
          </td>
          <td class="p-3 border-b">
            <div class="flex items-center gap-2">
              <button
                class="rounded-lg px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                type="button"
                onclick="startEdit(${i})"
              >
                Edit
              </button>
              <button
                class="rounded-lg px-3 py-1.5 text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700"
                type="button"
                onclick="deleteTodo(${i})"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

// --- Badges & helpers ---
function getDueBadge(todo) {
  if (todo.done) {
    return `<span class="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-medium">Completed</span>`;
  }
  const when = dueWhen(todo.dueDate);
  if (when === "overdue") {
    return `<span class="inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-xs font-medium">Overdue</span>`;
  }
  if (when === "today") {
    return `<span class="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-xs font-medium">Today</span>`;
  }
  return `<span class="inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs font-medium">Upcoming</span>`;
}

function dueWhen(iso) {
  if (!iso) return "upcoming";
  const d = new Date(iso + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (due.getTime() === today.getTime()) return "today";
  if (due < today) return "overdue";
  return "upcoming";
}

function formatDate(iso) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// --- Reset form UI ---
function resetForm() {
  editingIndex = null;

  const todoInputEl = document.getElementById("todo-input");
  const todoDateEl = document.getElementById("todo-date");
  const addBtn = document.getElementById("add-todo-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  const editHint = document.getElementById("edit-hint");

  todoInputEl.value = "";
  todoDateEl.value = "";

  addBtn.textContent = "Add Todo";
  addBtn.classList.remove(
    "bg-blue-600",
    "hover:bg-blue-700",
    "active:bg-blue-800"
  );
  addBtn.classList.add(
    "bg-teal-500",
    "hover:bg-teal-600",
    "active:bg-teal-700"
  );
  cancelBtn.classList.add("hidden");
  editHint.classList.add("hidden");
}

// --- Wire events ---
document.addEventListener("DOMContentLoaded", () => {
  renderTodos();

  const form = document.getElementById("todo-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (editingIndex === null) addTodo();
    else updateTodo();
  });

  // Clear All
  document
    .getElementById("clear-all-btn")
    .addEventListener("click", clearAllTodos);

  // Filters
  document.getElementById("filter-status").addEventListener("change", (e) => {
    filterStatus = e.target.value;
    renderTodos();
  });
  document.getElementById("filter-due").addEventListener("change", (e) => {
    filterDue = e.target.value;
    renderTodos();
  });
  document.getElementById("filter-search").addEventListener("input", (e) => {
    filterSearch = e.target.value;
    renderTodos();
  });

  // Cancel edit
  document
    .getElementById("cancel-edit-btn")
    .addEventListener("click", resetForm);
});

// expose for inline handlers (indexes are based on filtered list)
window.startEdit = startEdit;
window.deleteTodo = deleteTodo;
window.toggleDone = toggleDone;
