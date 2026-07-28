import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

function getInput() {
  return screen.getByPlaceholderText("やることを入力して Enter");
}

async function addTodo(text: string) {
  const user = userEvent.setup();
  await user.type(getInput(), `${text}{Enter}`);
  return user;
}

describe("App", () => {
  it("shows the empty state and no footer when there are no todos", () => {
    render(<App />);

    expect(screen.getByText("タスクはまだありません")).toBeInTheDocument();
    expect(screen.queryByText(/件残り/)).not.toBeInTheDocument();
  });

  it("adds a new todo to the list when submitted with Enter", async () => {
    render(<App />);

    await addTodo("牛乳を買う");

    expect(screen.getByText("牛乳を買う")).toBeInTheDocument();
    expect(getInput()).toHaveValue("");
    expect(screen.getByText("1 件残り")).toBeInTheDocument();
  });

  it("does not add a todo when the input is empty or only whitespace", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(getInput(), "   {Enter}");

    expect(screen.getByText("タスクはまだありません")).toBeInTheDocument();
  });

  it("marks a todo completed when its checkbox is checked and decreases the remaining count", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo("洗濯する");

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByText("0 件残り")).toBeInTheDocument();
    expect(screen.getByText("洗濯する").closest("li")).toHaveClass(
      "completed",
    );
  });

  it("removes a todo from the list when its delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo("捨てるタスク");

    await user.click(screen.getByRole("button", { name: "削除" }));

    expect(screen.queryByText("捨てるタスク")).not.toBeInTheDocument();
    expect(screen.getByText("タスクはまだありません")).toBeInTheDocument();
  });

  it("edits a todo's text on double-click and commits the change on Enter", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo("元のタスク");

    await user.dblClick(screen.getByText("元のタスク"));
    const editInput = screen.getByDisplayValue("元のタスク");
    await user.clear(editInput);
    await user.type(editInput, "編集後のタスク{Enter}");

    expect(screen.queryByText("元のタスク")).not.toBeInTheDocument();
    expect(screen.getByText("編集後のタスク")).toBeInTheDocument();
  });

  it("deletes the todo when it is edited down to an empty string", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo("消えるタスク");

    await user.dblClick(screen.getByText("消えるタスク"));
    const editInput = screen.getByDisplayValue("消えるタスク");
    await user.clear(editInput);
    await user.keyboard("{Enter}");

    expect(screen.getByText("タスクはまだありません")).toBeInTheDocument();
  });

  it("cancels editing without saving changes when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo("キャンセル対象");

    await user.dblClick(screen.getByText("キャンセル対象"));
    const editInput = screen.getByDisplayValue("キャンセル対象");
    await user.clear(editInput);
    await user.type(editInput, "書きかけ{Escape}");

    expect(screen.getByText("キャンセル対象")).toBeInTheDocument();
    expect(screen.queryByText("書きかけ")).not.toBeInTheDocument();
  });

  it("filters the visible todos when switching between all, active, and completed tabs", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo("未完了タスク");
    await addTodo("完了タスク");

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    const list = screen.getByRole("list");

    await user.click(screen.getByRole("button", { name: "未完了" }));
    expect(within(list).getByText("未完了タスク")).toBeInTheDocument();
    expect(within(list).queryByText("完了タスク")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "完了" }));
    expect(within(list).getByText("完了タスク")).toBeInTheDocument();
    expect(within(list).queryByText("未完了タスク")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "すべて" }));
    expect(within(list).getByText("未完了タスク")).toBeInTheDocument();
    expect(within(list).getByText("完了タスク")).toBeInTheDocument();
  });

  it("removes only completed todos when 'clear completed' is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo("残すタスク");
    await addTodo("消すタスク");

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    await user.click(screen.getByRole("button", { name: "完了済みを削除" }));

    expect(screen.getByText("残すタスク")).toBeInTheDocument();
    expect(screen.queryByText("消すタスク")).not.toBeInTheDocument();
  });

  it("toggles all todos to completed and back to active with the toggle-all button", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo("タスクA");
    await addTodo("タスクB");

    const toggleAll = screen.getByRole("button", { name: "すべて完了にする" });
    await user.click(toggleAll);

    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeChecked();
    }
    expect(screen.getByText("0 件残り")).toBeInTheDocument();

    await user.click(toggleAll);
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).not.toBeChecked();
    }
    expect(screen.getByText("2 件残り")).toBeInTheDocument();
  });

  it("persists todos to localStorage and restores them after remounting the app", async () => {
    const { unmount } = render(<App />);
    await addTodo("永続化されるタスク");
    unmount();

    render(<App />);

    expect(screen.getByText("永続化されるタスク")).toBeInTheDocument();
  });
});
