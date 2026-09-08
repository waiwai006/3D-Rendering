import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../app/api/image-proxy/route";

afterEach(() => vi.unstubAllGlobals());

describe("Centaline image loading", () => {
  it.each(["hk.centanet.com", "hkcdn.centanet.com", "hkfloorplan.centanet.com"])("loads images from %s", async host => {
    const fetchImage = vi.fn().mockResolvedValue(new Response(new Uint8Array([137, 80, 78, 71]), { headers: { "Content-Type": "image/png" } }));
    vi.stubGlobal("fetch", fetchImage);
    const response = await GET(new Request(`http://localhost/api/image-proxy?url=${encodeURIComponent(`https://${host}/floorplan/plan.png`)}`));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([137,80,78,71]));
  });

  it("still rejects unrelated hosts before fetching", async () => {
    const fetchImage = vi.fn();
    vi.stubGlobal("fetch", fetchImage);
    const response = await GET(new Request("http://localhost/api/image-proxy?url=https://unrelated.example/plan.png"));
    expect(response.status).toBe(403);
    expect(fetchImage).not.toHaveBeenCalled();
  });
});
