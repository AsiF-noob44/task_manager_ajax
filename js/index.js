const API_URL = "https://jsonplaceholder.typicode.com/todos";
let tasks = [];
let nextTaskId = 1;
let editingTaskId = null; // Track which task is being edited
let originalTaskTitle = ""; // Store original title for cancel functionality
let savingTaskId = null; // Track which task is currently being saved

function showLoading(show) {
  const loadingIndicator = document.getElementById("loading");
  if (show) {
    loadingIndicator.classList.remove("hidden");
  } else {
    loadingIndicator.classList.add("hidden");
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById("statusMessage");
  statusDiv.textContent = message;
  statusDiv.className = `mt-4 p-3 rounded-md ${
    type === "success"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800"
  }`;
  statusDiv.classList.remove("hidden");
  setTimeout(() => statusDiv.classList.add("hidden"), 3000);
}

function fetchTasks() {
  showLoading(true);
  const xhr = new XMLHttpRequest(); // creating an instance of XMLHttpRequest object.
  xhr.open("GET", API_URL + "?_limit=5", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      showLoading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          tasks = data.map((task) => ({
            // this will return an array of task objects into the tasks variable.
            id: task.id,
            title: task.title,
            completed: task.completed,
          }));
          nextTaskId = tasks.length
            ? Math.max(...tasks.map((t) => t.id)) + 1
            : 1;
          renderTasks();
          showStatus("Tasks loaded successfully!", "success");
        } catch {
          showStatus("Error loading tasks.", "error");
        }
      } else {
        showStatus("Error loading tasks.", "error");
      }
    }
  };

  xhr.onerror = function () {
    showLoading(false);
    showStatus("Network error while loading tasks.", "error");
  };
  xhr.send();
}

function createTask() {
  const taskInput = document.getElementById("taskInput");
  const taskTitle = taskInput.value.trim();

  // Check if the task title is empty
  if (!taskTitle) {
    showStatus("Please enter a task title.", "error");
    taskInput.focus();
    return;
  }

  showLoading(true);

  const newTask = {
    userId: 1,
    title: taskTitle,
    completed: false,
  };

  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newTask),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      // Assign a local ID since the API might return a generic ID
      data.id = nextTaskId++;
      tasks.unshift(data);
      renderTasks();
      taskInput.value = ""; // Clear input after creating task
      showStatus("Task created successfully!", "success");
    })
    .catch(() => {
      showStatus("Error creating task.", "error");
    })
    .finally(() => {
      showLoading(false);
    });
}

function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }

  fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      tasks = tasks.filter((task) => task.id !== id);
      renderTasks();
      showStatus("Task deleted successfully!", "success");
    })
    .catch((error) => {
      console.error("Error deleting task:", error);
      showStatus("Error deleting task.", "error");
    });
}

function editTask(id) {
  // If already editing a different task, cancel that first
  if (editingTaskId !== null && editingTaskId !== id) {
    cancelEdit();
  }

  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  editingTaskId = id;
  originalTaskTitle = task.title;
  renderTasks();
}

function saveEdit(id) {
  const editInput = document.getElementById(`edit-input-${id}`);
  const newTitle = editInput.value.trim();

  if (!newTitle) {
    showStatus("Task title cannot be empty.", "error");
    editInput.focus();
    return;
  }

  if (newTitle === originalTaskTitle) {
    // No changes made, just cancel edit
    cancelEdit();
    return;
  }

  // Set saving state
  savingTaskId = id;
  showLoading(true);
  renderTasks(); // Re-render to show saving state

  const updatedTask = {
    userId: 1,
    title: newTitle,
    completed: false,
  };

  fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedTask),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(() => {
      // Update local task
      const taskIndex = tasks.findIndex((t) => t.id === id);
      if (taskIndex !== -1) {
        tasks[taskIndex].title = newTitle;
      }
      editingTaskId = null;
      originalTaskTitle = "";
      savingTaskId = null; // Clear saving state
      renderTasks();
      showStatus("Task updated successfully!", "success");
    })
    .catch((error) => {
      console.error("Error updating task:", error);
      showStatus("Error updating task.", "error");
      savingTaskId = null; // Clear saving state on error too
      renderTasks(); // Re-render to restore normal buttons
    })
    .finally(() => {
      showLoading(false);
    });
}

function cancelEdit() {
  // Check if currently saving - if so, don't allow cancel
  if (editingTaskId !== null && savingTaskId === editingTaskId) {
    // Currently saving, show a message instead of canceling
    showStatus("Please wait while the task is being saved...", "error");
    return;
  }

  editingTaskId = null;
  originalTaskTitle = "";
  renderTasks();
}

function handleEditKeydown(event, id) {
  // Check if currently saving
  const isSaving = savingTaskId === id;

  if (event.key === "Enter" && !isSaving) {
    event.preventDefault();
    saveEdit(id);
  } else if (event.key === "Escape" && !isSaving) {
    event.preventDefault();
    cancelEdit();
  }
}

function toggleTaskComplete(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const updatedTask = {
    userId: 1,
    title: task.title,
    completed: !task.completed,
  };

  fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedTask),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(() => {
      // Update local task
      task.completed = !task.completed;
      renderTasks();
      showStatus(
        `Task marked as ${task.completed ? "completed" : "incomplete"}!`,
        "success"
      );
    })
    .catch((error) => {
      console.error("Error updating task:", error);
      showStatus("Error updating task status.", "error");
      // Revert checkbox state on error
      renderTasks();
    });
}

function renderTasks() {
  const taskList = document.getElementById("tasksList");
  if (tasks.length === 0) {
    taskList.innerHTML =
      '<p class="text-center text-gray-500 py-8">No tasks available. Add a new task.</p>';
    return;
  }
  taskList.innerHTML = tasks
    .map((task) => {
      const isEditing = editingTaskId === task.id;

      if (isEditing) {
        const isSaving = savingTaskId === task.id;
        const saveButtonText = isSaving ? "Saving..." : "Save";
        const saveButtonClass = isSaving
          ? "bg-gray-400 text-white cursor-not-allowed"
          : "bg-green-500 hover:bg-green-600 cursor-pointer text-white";
        const cancelButtonClass = isSaving
          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
          : "bg-gray-500 hover:bg-gray-600 cursor-pointer text-white";
        const saveButtonDisabled = isSaving ? "disabled" : "";
        const cancelButtonDisabled = isSaving ? "disabled" : "";

        return `<div class="flex items-center justify-between bg-blue-50 p-4 rounded-lg shadow-sm border-2 border-blue-300">
                  <div class="flex items-center gap-4 flex-grow min-w-0">
                      <input type="checkbox"
                          class="h-5 w-5 bg-white accent-blue-600 focus:outline-none focus:ring-blue-500 border-gray-300 rounded flex-shrink-0" disabled>
                      <input type="text" id="edit-input-${task.id}" value="${
          task.title
        }"
                          class="flex-grow border border-blue-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                          placeholder="Enter task title..."
                          onkeydown="handleEditKeydown(event, ${task.id})" ${
          isSaving ? "readonly" : ""
        }>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0 ml-4">
                      <button id="save-btn-${task.id}" onclick="${
          isSaving ? "" : `saveEdit(${task.id})`
        }" ${saveButtonDisabled}
                          class="${saveButtonClass} font-semibold tracking-wide px-3 py-2 rounded-lg h-10 flex items-center justify-center min-w-[80px]">${saveButtonText}</button>
                      <button id="cancel-btn-${task.id}" onclick="${
          isSaving ? "" : "cancelEdit()"
        }" ${cancelButtonDisabled}
                          class="${cancelButtonClass} font-semibold tracking-wide px-3 py-2 rounded-lg h-10 flex items-center justify-center min-w-[80px]">Cancel</button>
                  </div>
              </div>`;
      } else {
        return `<div class="flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-300">
                  <div class="flex items-center gap-4">
                      <input type="checkbox"
                          class="h-5 w-5 bg-white accent-blue-600 focus:outline-none focus:ring-blue-500 border-gray-300 rounded"
                          ${task.completed ? "checked" : ""}
                          onchange="toggleTaskComplete(${task.id})">
                      <span class="${
                        task.completed ? "line-through text-gray-500" : ""
                      }">${task.title}</span>
                  </div>
                  <div class="flex items-center gap-4">
                      <button onclick="editTask(${task.id})"
                          class="bg-yellow-500 font-semibold tracking-wide text-white px-4 py-2 rounded-lg hover:bg-yellow-600 cursor-pointer">Edit</button>
                      <button onclick="deleteTask(${task.id})"
                          class="bg-red-500 font-semibold tracking-wide text-white px-4 py-2 rounded-lg hover:bg-red-600 cursor-pointer">Delete</button>
                  </div>
              </div>`;
      }
    })
    .join("");

  // Focus on edit input if editing
  if (editingTaskId !== null) {
    setTimeout(() => {
      const editInput = document.getElementById(`edit-input-${editingTaskId}`);
      if (editInput) {
        editInput.focus();
        editInput.select();
      }
    }, 0);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  fetchTasks();
});
