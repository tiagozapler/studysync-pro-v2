/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { ApiFromModules } from "convex/server";
import type * as courses from "../courses.js";
import type * as files from "../files.js";
import type * as notes from "../notes.js";
import type * as events from "../events.js";
import type * as todos from "../todos.js";
import type * as quickNotes from "../quickNotes.js";
import type * as chatMessages from "../chatMessages.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage for example:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const api: ApiFromModules<{
  courses: typeof courses;
  files: typeof files;
  notes: typeof notes;
  events: typeof events;
  todos: typeof todos;
  quickNotes: typeof quickNotes;
  chatMessages: typeof chatMessages;
}>;
export default api;

export declare const internal: ApiFromModules<{
  courses: typeof courses;
  files: typeof files;
  notes: typeof notes;
  events: typeof events;
  todos: typeof todos;
  quickNotes: typeof quickNotes;
  chatMessages: typeof chatMessages;
}>;
