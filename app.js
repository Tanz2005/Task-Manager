document.addEventListener('DOMContentLoaded', () => {
  const taskInput = document.getElementById('task-input');
  const dueDateInput = document.getElementById('due-date');
  const priorityInput = document.getElementById('priority');
  const labelInput = document.getElementById('label');
  const recurrenceInput = document.getElementById('recurrence');
  const addTaskBtn = document.getElementById('add-task');
  const taskList = document.getElementById('task-list');
  const progress = document.getElementById('progress');
  const progressText = document.getElementById('progress-text');
  const sortSelect = document.getElementById('sort-by');
  const toggleDarkBtn = document.getElementById('toggle-dark');
  const quoteBox = document.getElementById('quote-box');
  const editModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
  const editTaskForm = document.getElementById('edit-task-form');
  const editTaskText = document.getElementById('edit-task-text');
  const editDueDate = document.getElementById('edit-due-date');
  const editPriority = document.getElementById('edit-priority');
  const editLabel = document.getElementById('edit-label');
  const editRecurrence = document.getElementById('edit-recurrence');

  flatpickr("#due-date", { dateFormat: "Y-m-d", minDate: "today" });
  flatpickr("#edit-due-date", { dateFormat: "Y-m-d", minDate: "today" });

  quoteBox.textContent = "Stay positive and productive today!";

  toggleDarkBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });

  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let selectedTaskIndex = null;
  let currentSort = 'none';
  let editingIndex = null;
  let editMode = false;

  addTaskBtn.addEventListener('click', () => {
    if (editMode) {
      updateTask();
    } else {
      addTask();
    }
  });

  taskInput.addEventListener('keypress', event => {
    if (event.key === 'Enter') {
      if (editMode) {
        updateTask();
      } else {
        addTask();
      }
    }
  });

  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    renderTasks();
  });

  document.addEventListener('keydown', handleKeyboardShortcuts);

  editTaskForm.addEventListener('submit', e => {
    e.preventDefault();
    if (editingIndex !== null) {
      const updatedTask = {
        text: editTaskText.value.trim(),
        completed: tasks[editingIndex].completed,
        dueDate: editDueDate.value,
        priority: editPriority.value,
        label: editLabel.value,
        recurrence: editRecurrence.value || 'None'
      };
      tasks[editingIndex] = updatedTask;
      saveAndRender();
      editingIndex = null;
      editModal.hide();
    }
  });

  renderTasks();

  function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const task = {
      text,
      completed: false,
      dueDate: dueDateInput.value,
      priority: priorityInput.value,
      label: labelInput.value,
      recurrence: recurrenceInput.value || 'None'
    };

    tasks.push(task);
    saveAndRender();
    resetForm();
    selectedTaskIndex = tasks.length - 1;
    scrollToTask(selectedTaskIndex);
  }

  function startEditTask(index) {
    editingIndex = index;
    const task = tasks[index];
    editTaskText.value = task.text;
    editDueDate._flatpickr.setDate(task.dueDate || null);
    editPriority.value = task.priority || 'Medium';
    editLabel.value = task.label || 'General';
    editRecurrence.value = task.recurrence || 'None';
    editModal.show();
  }

  function updateTask() {
    const text = taskInput.value.trim();
    if (!text || selectedTaskIndex === null) return;

    const updatedTask = {
      text,
      completed: tasks[selectedTaskIndex].completed,
      dueDate: dueDateInput.value,
      priority: priorityInput.value,
      label: labelInput.value,
      recurrence: recurrenceInput.value || 'None'
    };
    tasks[selectedTaskIndex] = updatedTask;
    saveAndRender();
    resetForm();
    addTaskBtn.textContent = 'Add Task';
    editMode = false;
    selectedTaskIndex = null;
  }

  function resetForm() {
    taskInput.value = '';
    dueDateInput.value = '';
    priorityInput.value = 'Medium';
    labelInput.value = 'General';
    recurrenceInput.value = 'None';
  }

  function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    const task = tasks[index];
    if (task.completed && task.recurrence && task.recurrence !== 'None') {
      let nextDueDate = null;
      if (task.dueDate) {
        let date = new Date(task.dueDate);
        switch(task.recurrence) {
          case 'Daily': date.setDate(date.getDate() + 1); break;
          case 'Weekly': date.setDate(date.getDate() + 7); break;
          case 'Monthly': date.setMonth(date.getMonth() + 1); break;
        }
        nextDueDate = date.toISOString().slice(0, 10);
      }
      if (nextDueDate) {
        const newTask = {
          text: task.text,
          completed: false,
          dueDate: nextDueDate,
          priority: task.priority,
          label: task.label,
          recurrence: task.recurrence
        };
        tasks.push(newTask);
      }
    }
    saveAndRender();
  }

  function deleteTask(index) {
    const li = taskList.children[index];
    li.classList.add('removed');
    setTimeout(() => {
      tasks.splice(index, 1);
      saveAndRender();
      if (selectedTaskIndex === index || editingIndex === index) {
        selectedTaskIndex = null;
        editingIndex = null;
        editMode = false;
        addTaskBtn.textContent = 'Add Task';
        resetForm();
        editModal.hide();
      }
    }, 300);
  }

  function isOverdue(dueDate, completed) {
    if (!dueDate || completed) return false;
    const due = new Date(dueDate);
    const today = new Date(new Date().toDateString());
    return due < today;
  }

  function renderTasks() {
    let tasksToRender = [...tasks];

    if (currentSort === 'priority') {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      tasksToRender.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (currentSort === 'dueDate') {
      tasksToRender.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else if (currentSort === 'label') {
      tasksToRender.sort((a, b) => a.label.localeCompare(b.label));
    }

    taskList.innerHTML = '';

    tasksToRender.forEach(task => {
      const index = tasks.indexOf(task);
      const li = document.createElement('li');
      li.className = `list-group-item d-flex justify-content-between align-items-center prio-${task.priority} ${task.completed ? 'completed' : ''}`;
      if (isOverdue(task.dueDate, task.completed)) li.classList.add('list-group-item-danger');

      if ((selectedTaskIndex === index && !editingIndex) || (editingIndex === index)) {
        li.style.outline = '2px solid dodgerblue';
      }

      const mainDiv = document.createElement('div');
      mainDiv.className = 'flex-grow-1';

      const taskSpan = document.createElement('span');
      taskSpan.textContent = (task.completed ? '✅ ' : '⏳ ') + task.text;
      taskSpan.style.cursor = 'pointer';
      taskSpan.addEventListener('click', e => {
        e.stopPropagation();
        toggleTask(index);
      });
      mainDiv.appendChild(taskSpan);

      const labelSpan = document.createElement('span');
      labelSpan.className = 'badge bg-secondary rounded-pill ms-3';
      labelSpan.textContent = task.label;
      mainDiv.appendChild(labelSpan);

      li.appendChild(mainDiv);

      const metaDiv = document.createElement('div');
      metaDiv.className = 'text-end';

      if (task.dueDate) {
        const due = document.createElement('small');
        due.className = 'text-muted d-block';
        due.textContent = `Due: ${task.dueDate}`;
        metaDiv.appendChild(due);
      }

      const prioBadge = document.createElement('span');
      prioBadge.className = 'badge rounded-pill bg-primary ms-2';
      prioBadge.textContent = task.priority;
      metaDiv.appendChild(prioBadge);

      if (task.recurrence && task.recurrence !== 'None') {
        const recBadge = document.createElement('span');
        recBadge.className = 'recurrence-badge ms-2';
        recBadge.textContent = `Recurs: ${task.recurrence}`;
        metaDiv.appendChild(recBadge);
      }

      li.appendChild(metaDiv);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger btn-sm ms-2';
      delBtn.textContent = 'Delete';
      delBtn.onclick = e => {
        e.stopPropagation();
        deleteTask(index);
      };
      li.appendChild(delBtn);

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-warning btn-sm ms-2';
      editBtn.textContent = 'Edit';
      editBtn.onclick = e => {
        e.stopPropagation();
        startEditTask(index);
      };
      li.appendChild(editBtn);

      li.addEventListener('click', () => selectTask(index));

      taskList.appendChild(li);
    });
    updateProgress();
  }

  function updateProgress() {
    const completed = tasks.filter(task => task.completed).length;
    const total = tasks.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    progress.style.width = `${percent}%`;
    progress.textContent = `${percent}% completed`;

    if (percent < 40) {
      progress.className = 'progress-bar bg-danger';
    } else if (percent < 70) {
      progress.className = 'progress-bar bg-warning';
    } else {
      progress.className = 'progress-bar bg-success';
    }
  }

  function saveAndRender() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
  }

  function selectTask(index) {
    selectedTaskIndex = index;
    renderTasks();
    scrollToTask(index);
  }
  function scrollToTask(index) {
    const li = taskList.children[index];
    if (li) li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function handleKeyboardShortcuts(e) {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.key === 'Delete' && selectedTaskIndex !== null) {
      e.preventDefault();
      deleteTask(selectedTaskIndex);
    } else if (e.key === 'Enter' && e.ctrlKey && selectedTaskIndex !== null) {
      e.preventDefault();
      toggleTask(selectedTaskIndex);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedTaskIndex = selectedTaskIndex === null ? 0 : Math.min(selectedTaskIndex + 1, tasks.length - 1);
      renderTasks();
      scrollToTask(selectedTaskIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedTaskIndex = selectedTaskIndex === null ? 0 : Math.max(selectedTaskIndex - 1, 0);
      renderTasks();
      scrollToTask(selectedTaskIndex);
    } else if (e.key === 'Enter' && selectedTaskIndex === null && !editMode) {
      addTask();
    }
  }
});