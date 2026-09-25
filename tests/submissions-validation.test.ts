import assert from "node:assert/strict";
import test from "node:test";
import { adminSampleSchema, attachmentSchema, sampleContentType, submissionSchema } from "../lib/submissions/validation";

const contact = { name: "Sample Tester", email: "TEST@example.test", company: "Synthetic Robotics", category: "scene_videos", description: "Synthetic input only." };
const file = { originalFilename: "scene.mp4", relativePath: "warehouse/scene.mp4", sizeBytes: 1024 };
test("normalizes contact and accepts safe nested sample paths", () => {
  const parsed = submissionSchema().parse({ ...contact, files: [file] });
  assert.equal(parsed.email, "test@example.test");
  assert.equal(parsed.files[0].relativePath, "warehouse/scene.mp4");
});
test("rejects traversal, absolute paths and control characters", () => {
  for (const relativePath of ["../scene.mp4", "/scene.mp4", "folder/../scene.mp4", "folder\\scene.mp4", "folder//scene.mp4", "folder/\nscene.mp4"]) {
    assert.equal(attachmentSchema.safeParse({ ...file, relativePath }).success, false, relativePath);
  }
});
test("rejects executable markup, name mismatch and empty files", () => {
  assert.equal(attachmentSchema.safeParse({ ...file, originalFilename: "script.html", relativePath: "script.html" }).success, false);
  assert.equal(attachmentSchema.safeParse({ ...file, relativePath: "other.mp4" }).success, false);
  assert.equal(attachmentSchema.safeParse({ ...file, sizeBytes: 0 }).success, false);
  assert.equal(sampleContentType("view.SVG"), null);
  assert.equal(sampleContentType("robot.MCAP"), "application/octet-stream");
});
test("enforces file count, per-file and aggregate byte limits on the server schema", () => {
  const schema = submissionSchema({ maxFiles: 2, maxFileBytes: 1500, maxTotalBytes: 1800 });
  assert.equal(schema.safeParse({ ...contact, files: [{ ...file, sizeBytes: 1501 }] }).success, false);
  assert.equal(schema.safeParse({ ...contact, files: [file, { ...file, relativePath: "other/scene.mp4" }] }).success, false);
  assert.equal(schema.safeParse({ ...contact, files: [1, 2, 3].map((n) => ({ ...file, sizeBytes: 1, relativePath: `${n}/scene.mp4` })) }).success, false);
  assert.equal(schema.safeParse({ ...contact, files: [] }).success, false);
});
test("rejects duplicate paths and honeypot submissions", () => {
  assert.equal(submissionSchema().safeParse({ ...contact, files: [file, file] }).success, false);
  assert.equal(submissionSchema().safeParse({ ...contact, website: "https://spam.test", files: [file] }).success, false);
});
test("restricts categories/status and bounds private notes", () => {
  assert.equal(submissionSchema().safeParse({ ...contact, category: "arbitrary", files: [file] }).success, false);
  assert.equal(adminSampleSchema.safeParse({ ...contact, status: "published" }).success, false);
  assert.equal(adminSampleSchema.safeParse({ ...contact, status: "reviewing", internalNotes: "a".repeat(20001) }).success, false);
  assert.equal(adminSampleSchema.safeParse({ ...contact, status: "reviewing", internalNotes: "Call scheduled" }).success, true);
});
