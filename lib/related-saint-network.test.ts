import assert from "node:assert/strict";
import test from "node:test";
import { collectRelatedSaintDepths } from "./related-saint-network";

const edge = (fromSaintId: string, toSaintId: string) => ({ fromSaintId, toSaintId });

function network(published: string[], edges: ReturnType<typeof edge>[]) {
  let calls = 0;
  return {
    ids: async (ids: string[], take?: number) => ids.filter((id) => published.includes(id)).sort().slice(0, take),
    edges: async (frontier: string[]) => {
      calls += 1;
      return edges.filter((row) => frontier.includes(row.fromSaintId) || frontier.includes(row.toSaintId));
    },
    calls: () => calls
  };
}

test("Pant Maharaj reaches other incarnation branches beyond Dattatreya at step three", async () => {
  const graph = network(["pant", "balappa", "akkalkot", "datta", "narasimha", "sripada"], [
    edge("pant", "balappa"), edge("balappa", "akkalkot"), edge("akkalkot", "datta"),
    edge("narasimha", "datta"), edge("datta", "sripada")
  ]);
  const depths = await collectRelatedSaintDepths("pant", ["balappa"], 8, graph.ids, graph.edges);
  assert.deepEqual([...depths], [["balappa", 1], ["akkalkot", 2], ["datta", 3], ["narasimha", 4], ["sripada", 4]]);
});

test("cycles terminate without returning the current saint or duplicates", async () => {
  const graph = network(["a", "b", "c"], [edge("a", "b"), edge("b", "c"), edge("c", "a")]);
  const depths = await collectRelatedSaintDepths("a", ["b", "c", "b", "a"], 8, graph.ids, graph.edges);
  assert.deepEqual([...depths], [["b", 1], ["c", 1]]);
  assert.equal(graph.calls(), 1);
});

test("stops when eight candidates are collected and preserves nearest connections", async () => {
  const ids = Array.from({ length: 12 }, (_, index) => String(index).padStart(2, "0"));
  const graph = network(ids, ids.slice(1).map((id, index) => edge(ids[index], id)));
  const depths = await collectRelatedSaintDepths(ids[0], [ids[1]], 8, graph.ids, graph.edges);
  assert.equal(depths.size, 8);
  assert.equal(depths.get("08"), 8);
  assert.equal(depths.has("09"), false);
  assert.equal(graph.calls(), 7);
});

test("unpublished saints cannot be returned or bridge into another branch", async () => {
  const graph = network(["root", "visible", "beyond"], [edge("visible", "draft"), edge("draft", "beyond")]);
  const depths = await collectRelatedSaintDepths("root", ["visible", "draft"], 8, graph.ids, graph.edges);
  assert.deepEqual([...depths], [["visible", 1]]);
});
