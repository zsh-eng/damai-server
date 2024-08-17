import { CanvasClient } from "@/services/canvas/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/canvas/client", () => {
    const CanvasClient = vi.fn();
    return {
        CanvasClient,
    };
});

describe("CanvasClient", () => {
    it("should pass", () => {
        expect(true).toBe(true);
    });

    it("should call CanvasClient", () => {
        new CanvasClient("");
        expect(CanvasClient).toHaveBeenCalled();
    });
});
