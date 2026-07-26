import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import { useLocalStorage } from "./useLocalStorage";
import type { Filter, Todo } from "./types";

function createId() {
  return crypto.randomUUID();
}

export default function App() {
  const [todos, setTodos] = useLocalStorage<Todo[]>("todos", []);
  const [filter, setFilter] = useState<Filter>("all");
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const remainingCount = useMemo(
    () => todos.filter((todo) => !todo.completed).length,
    [todos],
  );

  const visibleTodos = useMemo(() => {
    switch (filter) {
      case "active":
        return todos.filter((todo) => !todo.completed);
      case "completed":
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  function handleAddTodo(event: FormEvent) {
    event.preventDefault();
    const text = newTodo.trim();
    if (!text) return;
    setTodos([
      { id: createId(), text, completed: false, createdAt: Date.now() },
      ...todos,
    ]);
    setNewTodo("");
  }

  function toggleTodo(id: string) {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }

  function deleteTodo(id: string) {
    setTodos(todos.filter((todo) => todo.id !== id));
  }

  function startEditing(todo: Todo) {
    setEditingId(todo.id);
    setEditingText(todo.text);
  }

  function commitEditing() {
    const text = editingText.trim();
    if (editingId === null) return;
    if (text) {
      setTodos(
        todos.map((todo) =>
          todo.id === editingId ? { ...todo, text } : todo,
        ),
      );
    } else {
      setTodos(todos.filter((todo) => todo.id !== editingId));
    }
    setEditingId(null);
    setEditingText("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingText("");
  }

  function clearCompleted() {
    setTodos(todos.filter((todo) => !todo.completed));
  }

  function toggleAll() {
    const allCompleted = todos.length > 0 && remainingCount === 0;
    setTodos(todos.map((todo) => ({ ...todo, completed: !allCompleted })));
  }

  return (
    <div className="app">
      <h1>TODO</h1>

      <form className="add-form" onSubmit={handleAddTodo}>
        <button
          type="button"
          className={`toggle-all ${todos.length > 0 && remainingCount === 0 ? "checked" : ""}`}
          onClick={toggleAll}
          aria-label="すべて完了にする"
          disabled={todos.length === 0}
        >
          ✓
        </button>
        <input
          type="text"
          value={newTodo}
          onChange={(event) => setNewTodo(event.target.value)}
          placeholder="やることを入力して Enter"
          autoFocus
        />
      </form>

      <ul className="todo-list">
        {visibleTodos.map((todo) => (
          <li key={todo.id} className={todo.completed ? "completed" : ""}>
            {editingId === todo.id ? (
              <input
                type="text"
                className="edit-input"
                value={editingText}
                autoFocus
                onChange={(event) => setEditingText(event.target.value)}
                onBlur={commitEditing}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitEditing();
                  if (event.key === "Escape") cancelEditing();
                }}
              />
            ) : (
              <>
                <label className="todo-item">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                  />
                  <span onDoubleClick={() => startEditing(todo)}>
                    {todo.text}
                  </span>
                </label>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteTodo(todo.id)}
                  aria-label="削除"
                >
                  ×
                </button>
              </>
            )}
          </li>
        ))}
        {todos.length === 0 && (
          <li className="empty-state">タスクはまだありません</li>
        )}
      </ul>

      {todos.length > 0 && (
        <footer className="footer">
          <span>{remainingCount} 件残り</span>
          <div className="filters">
            {(["all", "active", "completed"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={filter === f ? "active" : ""}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "すべて" : f === "active" ? "未完了" : "完了"}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="clear-completed"
            onClick={clearCompleted}
            disabled={remainingCount === todos.length}
          >
            完了済みを削除
          </button>
        </footer>
      )}
    </div>
  );
}
