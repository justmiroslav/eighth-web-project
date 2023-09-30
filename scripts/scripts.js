class TodoItem {
    constructor(taskInput, status, taskCreationTime) {
        this.taskInput = taskInput;
        this.status = status;
        this.taskCounter = TodoItem.incrementTaskCounter();
        this.taskCreationTime = taskCreationTime;
    }

    static incrementTaskCounter() {
        if (!this.taskCounter) {
            this.taskCounter = 0;
        }
        return ++this.taskCounter;
    }

    toggleStatus() {
        this.status = !this.status;
    }

    render() {
        const statusText = this.status ? "completed" : "uncompleted";
        const statusIcon = this.status ? "\u2714" : "\u2718";
        return `
            <div class="task-number">Task ${this.taskCounter}</div>
            <div class="task-info">
                <p class="task-description">${this.taskInput}</p>
            </div>
            <div class="side-elements">
                <div class="task-creation">
                    <p class="task-creation-time">${this.taskCreationTime}</p>
                </div>
                <div class="status">
                    <span class="status-text">${statusText}</span>
                    <span class="status-icon">${statusIcon}</span>
                </div>
                <div class="task-edit">
                    <button class="remove-task">Remove task</button>
                </div>
            </div>
        `;
    }
}

class TodoItemPremium extends TodoItem {
    constructor(taskInput, status, taskCreationTime, iconUrl) {
        super(taskInput, status, taskCreationTime);
        this.iconUrl = iconUrl;
    }

    render() {
        const parentRenderedHTML = super.render();
        return `
            ${parentRenderedHTML.replace(
                '<div class="task-info">',
                `
                <div class="premium-icon">
                    <img src="${this.iconUrl}" style="max-height: 40px;">
                </div>
                <div class="task-info">
                `
            )}
        `;
    }
}

const input = document.getElementById("task-input");
const createTaskBtn = document.getElementById("create-task-btn");
const clearCompletedBtn = document.getElementById("clear-completed");
const clearAllTasksBtn = document.getElementById("clear-all");
const sortAscendingBtn = document.getElementById("sort-ascending");
const sortDescendingBtn = document.getElementById("sort-descending");
const clearStorageBtn = document.getElementById("clear-storage");
const pickTodoBtn = document.getElementById("pick-todo");
const listOfTasks = document.querySelector(".list-of-tasks");

createTaskBtn.addEventListener('click', () => {
    const taskInput = input.value;
    if (taskInput === '') {
        alert('Before adding the task, make sure you have filled in all the fields');
    } else {
        const taskCreationTime = new Date().toLocaleString();
        const iconUrl = 'images/icon.jpg';
        const newTask = new TodoItemPremium(taskInput, false, taskCreationTime, iconUrl);
        addNewTask(newTask);
        input.value = '';
        saveTasksToLocalStorage();
    }
});

clearCompletedBtn.addEventListener("click", () => {
    const completedTasks = listOfTasks.querySelectorAll(".completed");
    if (completedTasks.length > 0) {
        completedTasks.forEach((completedTask) => {
            listOfTasks.removeChild(completedTask);
        });
        renumberTasks();
        saveTasksToLocalStorage();
    } else {
        alert("There are no completed tasks");
    }
});

clearAllTasksBtn.addEventListener("click", () => {
    const allTasks = listOfTasks.querySelectorAll(".new-task");
    if (allTasks.length > 0) {
        const uncompletedTasks = listOfTasks.querySelectorAll(".new-task.uncompleted");

        if (uncompletedTasks.length > 0) {
            const confirmDelete = confirm("Are you sure you want to delete all uncompleted tasks?");
            if (!confirmDelete) {
                return;
            }
        }

        allTasks.forEach((task) => {
            listOfTasks.removeChild(task);
        });

        renumberTasks();
        saveTasksToLocalStorage();
    } else {
        alert("Empty list of tasks, nothing to delete");
    }
});

sortAscendingBtn.addEventListener("click", () => {
    sortTasks(true);
});

sortDescendingBtn.addEventListener("click", () => {
    sortTasks(false);
});

clearStorageBtn.addEventListener("click", () => {
    localStorage.removeItem("tasks");
    listOfTasks.innerHTML = "";
    alert("Local storage cleared");
});

pickTodoBtn.addEventListener("click", () => {
    const tasks = listOfTasks.querySelectorAll(".new-task");
    if (tasks.length > 0) {
        const randomIndex = Math.floor(Math.random() * tasks.length);

        tasks.forEach(task => {
            task.classList.remove("active");
        });

        tasks[randomIndex].classList.add("active");
    } else {
        alert("There are no tasks to pick from.");
    }
});

function addNewTask(todoItem) {
    listOfTasks.prepend(createTaskElement(todoItem));
    renumberTasks();
}

function createTaskElement(todoItem) {
    const newTask = document.createElement("div");
    newTask.classList.add("new-task", "uncompleted");
    newTask.innerHTML = todoItem.render();

    const removeTask = newTask.querySelector(".remove-task");
    removeTask.addEventListener("click", () => {
        listOfTasks.removeChild(newTask);
        renumberTasks();
    });

    let isEditMode = false;

    newTask.addEventListener("dblclick", () => {
        if (!isEditMode) {
            isEditMode = true;
            const taskDescriptionElement = newTask.querySelector(".task-description");

            const editInput = document.createElement("input");
            const currentText = taskDescriptionElement.textContent;
            editInput.type = "text";
            editInput.value = currentText;

            taskDescriptionElement.textContent = "";
            taskDescriptionElement.appendChild(editInput);

            editInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    todoItem.taskInput = editInput.value;
                    saveEdit(newTask, todoItem);
                    isEditMode = false;
                } else if (e.key === "Escape") {
                    cancelEdit(newTask, todoItem);
                    isEditMode = false;
                }
            });
        }
    });

    let clickTimeout;

    newTask.addEventListener("click", () => {
        if (!isEditMode) {
            if (!clickTimeout) {
                clickTimeout = setTimeout(() => {
                    todoItem.toggleStatus();
                    const statusTextElement = newTask.querySelector(".status-text");
                    const statusIconElement = newTask.querySelector(".status-icon");
                    if (todoItem.status) {
                        statusTextElement.textContent = "completed";
                        statusIconElement.textContent = "\u2714";
                    } else {
                        statusTextElement.textContent = "uncompleted";
                        statusIconElement.textContent = "\u2718";
                    }  
                    newTask.classList.toggle("completed", todoItem.status);
                    newTask.classList.toggle("uncompleted", !todoItem.status);
                    clickTimeout = null;
                }, 300);
            } else {
                clearTimeout(clickTimeout);
                clickTimeout = null;
            }
        }
    });

    return newTask;
}

function saveEdit(taskElement, todoItem) {
    const taskDescription = taskElement.querySelector(".task-description");
    const taskCreationTime = taskElement.querySelector(".task-creation-time");
    const editInput = taskElement.querySelector("input");

    taskDescription.textContent = todoItem.taskInput;

    const updatedDate = new Date().toLocaleString();
    taskCreationTime.textContent = updatedDate;

    editInput.remove();
    taskDescription.style.display = "block";
    taskCreationTime.style.display = "block";

    listOfTasks.prepend(taskElement);
    renumberTasks();
}

function cancelEdit(taskElement, todoItem) {
    const taskDescription = taskElement.querySelector(".task-description");
    const taskCreationTime = taskElement.querySelector(".task-creation-time");
    const editInput = taskElement.querySelector("input");

    const originalText = todoItem.taskInput;
    taskDescription.textContent = originalText;

    const originalDate = todoItem.taskCreationTime;
    taskCreationTime.textContent = originalDate;

    editInput.remove();
    taskDescription.style.display = "block";
    taskCreationTime.style.display = "block";
}

window.addEventListener("load", () => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
        const tasks = JSON.parse(savedTasks);
        const sortingOrder = localStorage.getItem("sortingOrder");
        tasks.forEach(task => {
            const todoItem = new TodoItem(task.taskInput, task.status, task.taskCreationTime);
            addNewTask(todoItem);
        });

        renumberTasks();

        sortTasks(sortingOrder === "ascending");
    }
});

function saveTasksToLocalStorage() {
    const tasks = [];
    const taskElements = listOfTasks.querySelectorAll(".new-task");
    taskElements.forEach(taskElement => {
        const taskInput = taskElement.querySelector(".task-description").textContent;
        const status = taskElement.classList.contains("completed");
        const taskCreationTime = taskElement.querySelector(".task-creation-time").textContent;
        tasks.push({ taskInput, status, taskCreationTime });
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function sortTasks(ascending) {
    const tasks = Array.from(listOfTasks.querySelectorAll(".new-task"));
    tasks.sort((a, b) => {
        const dateA = getDateFromString(a);
        const dateB = getDateFromString(b);

        if (ascending) {
            return dateA - dateB;
        } else {
            return dateB - dateA;
        }
    });

    listOfTasks.innerHTML = "";
    tasks.forEach(task => {
        listOfTasks.appendChild(task);
    });

    renumberTasks();

    localStorage.setItem("sortingOrder", ascending ? "ascending" : "descending");
}
  
function getDateFromString(task) {
    const dateStr = task.querySelector(".task-creation-time").textContent; 
    const [day, month, year, hour, minute, second] = dateStr.split(/[.:,-]/);
    const formatted = `${month}/${day}/${year} ${hour}:${minute}:${second}`;
    return new Date(formatted); 
}

function renumberTasks() {
    const tasks = listOfTasks.querySelectorAll(".new-task");
    tasks.forEach((task, index) => {
        const taskNumberElement = task.querySelector(".task-number");
        if (taskNumberElement) {
            taskNumberElement.textContent = `Task ${index + 1}`;
        }
    });
}