import assert from "node:assert/strict";
import test from "node:test";
import { sampleTimeline } from "../components/workflow/scroll-timeline";

test("the site is complete before training begins", () => {
  const site = sampleTimeline(1.3);
  assert.equal(site.site, 1);
  assert.equal(site.activity, 0);
  assert.equal(sampleTimeline(2.2).activity, 1);
});

test("scrolling traverses one complete grasp and placement", () => {
  const cycles = [2, 2.3, 2.5, 2.7, 2.95].map(position => sampleTimeline(position).cycle);
  assert.ok(cycles[0] < 0.25);
  assert.ok(cycles[2] > 0.25 && cycles[2] < 0.77);
  assert.ok(cycles.at(-1)! > 0.77);
  assert.deepEqual(cycles, [...cycles].sort((a,b) => a-b));
});

test("reverse scrolling and repeated sampling restore the same visual state", () => {
  const positions = [0.1, 0.92, 1.3, 2.45, 3.65, 4.6];
  const forward = positions.map(position => sampleTimeline(position));
  const backward = [...positions].reverse().map(position => sampleTimeline(position)).reverse();
  assert.deepEqual(forward, backward);
  assert.deepEqual(sampleTimeline(2.45), sampleTimeline(2.45));
});

test("camera and robot geometry stay continuous across chapter boundaries", () => {
  for (const boundary of [1,2,3,4]) {
    const before = sampleTimeline(boundary - 0.0001);
    const after = sampleTimeline(boundary + 0.0001);
    for (const key of ["site", "activity", "orbit", "cycle"] as const) {
      assert.ok(Math.abs(before[key]-after[key]) < 0.005, `${key} at ${boundary}`);
    }
  }
});

test("reduced motion uses stable poses and does not fade early chapters", () => {
  for (let stage=0; stage<5; stage++) {
    const start = sampleTimeline(stage+0.1,true);
    const end = sampleTimeline(stage+0.8,true);
    for (const key of ["site", "activity", "orbit", "cycle", "evaluation", "improvement"] as const) assert.equal(start[key],end[key]);
    assert.equal(start.improvement,stage===4?1:0);
  }
});

test("scroll overshoot holds the first and last states", () => {
  assert.deepEqual(sampleTimeline(-1),sampleTimeline(0));
  assert.deepEqual(sampleTimeline(20),sampleTimeline(4.999));
  assert.equal(sampleTimeline(20).improvement,1);
});
