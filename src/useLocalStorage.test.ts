import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  it("returns the given initial value when localStorage has nothing stored for the key", () => {
    const { result } = renderHook(() => useLocalStorage("missing-key", 42));

    expect(result.current[0]).toBe(42);
  });

  it("reads and parses a value already stored in localStorage instead of the initial value", () => {
    localStorage.setItem("existing-key", JSON.stringify(["a", "b"]));

    const { result } = renderHook(() =>
      useLocalStorage<string[]>("existing-key", []),
    );

    expect(result.current[0]).toEqual(["a", "b"]);
  });

  it("writes the new value to localStorage as JSON when the setter is called", () => {
    const { result } = renderHook(() => useLocalStorage("count", 0));

    act(() => {
      result.current[1](5);
    });

    expect(result.current[0]).toBe(5);
    expect(localStorage.getItem("count")).toBe("5");
  });

  it("falls back to the initial value when the stored data is corrupted JSON", () => {
    localStorage.setItem("broken-key", "{not valid json");

    const { result } = renderHook(() =>
      useLocalStorage("broken-key", "fallback"),
    );

    expect(result.current[0]).toBe("fallback");
  });

  it("keeps values under different keys independent from one another", () => {
    localStorage.setItem("key-a", JSON.stringify("value-a"));
    localStorage.setItem("key-b", JSON.stringify("value-b"));

    const { result: a } = renderHook(() => useLocalStorage("key-a", ""));
    const { result: b } = renderHook(() => useLocalStorage("key-b", ""));

    expect(a.current[0]).toBe("value-a");
    expect(b.current[0]).toBe("value-b");
  });
});
