import { renderHook, act } from "@testing-library/react";
import { useSignUp } from "./useSignUp";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignUp = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createSupabaseClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}));

describe("useSignUp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns signUp function, isLoading, and error", () => {
    const { result } = renderHook(() => useSignUp());
    expect(result.current.signUp).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("calls signUp with email, password, and user metadata", async () => {
    mockSignUp.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      await result.current.signUp({
        email: "new@b.com",
        password: "secret",
        firstName: "Jane",
        lastName: "Doe",
      });
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "new@b.com",
      password: "secret",
      options: {
        data: { first_name: "Jane", last_name: "Doe" },
      },
    });
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("sets error on failed signup", async () => {
    mockSignUp.mockResolvedValue({ error: { message: "Email already registered" } });

    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      await result.current.signUp({
        email: "exists@b.com",
        password: "secret",
        firstName: "J",
        lastName: "D",
      });
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(result.current.error).toBe("An error occurred");
  });
});
