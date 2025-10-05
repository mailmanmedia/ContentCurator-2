# Live Presentation System - Comprehensive Audit Report
**Date:** October 5, 2025  
**Status:** Critical Issues Identified

## Executive Summary
The Live Presentation System has several critical issues affecting camera functionality, user experience, and workflow efficiency. This audit identifies 6 major issues and provides recommended solutions.

---

## Critical Issues

### 1. 🔴 Camera Disconnection When Switching Tabs
**Severity:** CRITICAL  
**Status:** Confirmed Bug

**Problem:**
- When users navigate away from the Control tab (where the VideoCompositor renders), camera streams are maintained in memory
- However, the React component lifecycle causes camera streams to disconnect when the VideoCompositor component unmounts
- When returning to the Control tab, cameras don't automatically reconnect

**Root Cause:**
- `VideoCompositor.tsx` (line 83-122) initializes camera streams in a `useEffect` that depends on `videoSources`
- The cleanup function properly stops tracks when dependencies change, but doesn't account for tab switching scenarios
- The component is unmounted when switching tabs, causing all MediaStream tracks to be stopped

**Impact:**
- Users lose camera feeds when navigating between tabs
- Must manually reconnect cameras after each tab switch
- Breaks live production workflow

**Recommended Solution:**
- Implement a global camera stream manager that persists across tab changes
- Use React Context or a separate service to maintain camera connections
- Only cleanup streams when explicitly disconnected or when component truly unmounts

---

### 2. 🟡 Preview Functionality Not Working
**Severity:** HIGH  
**Status:** Requires Testing

**Problem:**
- Users report that clicking "Test Preview" after selecting a camera source doesn't show the preview
- The preview video element is rendered conditionally based on `previewStream` state

**Current Implementation:**
- `VideoSourceManager.tsx` (line 166-181) has `startCameraPreview` function
- Function requests camera access and sets preview stream
- Video element at line 359-368 should display the stream

**Potential Issues:**
1. Permission problems - browser may block camera access
2. deviceId may not match actual device
3. Video element not properly receiving stream object
4. Autoplay restrictions in browser

**Recommended Solution:**
- Add better error handling and user feedback
- Verify camera permissions before attempting preview
- Add loading state while camera initializes
- Test across different browsers

---

### 3. 🔴 Missing Template System for Video Sources
**Severity:** HIGH  
**Status:** Feature Gap

**Problem:**
- No template/preset system for video sources
- Users must manually configure each camera source every time
- No way to save favorite configurations
- No dropdown of common source types

**Current State:**
- Schema exists for video sources (`shared/schema.ts` line 456-472)
- No template table or preset system
- No UI for saving/loading source presets

**User Requirements:**
1. Dropdown templates for common source types (e.g., "Studio Camera 1", "PTZ Camera", "Webcam")
2. Ability to save custom source configurations as templates
3. Quick selection from saved templates
4. Editable template names

**Recommended Solution:**
- Add `sourceTemplates` table to schema with fields: name, sourceType, defaultConfig
- Create UI component for managing source templates
- Add "Load from Template" option in VideoSourceManager
- Add "Save as Template" option after configuring a source

---

### 4. 🔴 Missing Template System for Presentation Sets
**Severity:** HIGH  
**Status:** Feature Gap

**Problem:**
- No template/preset system for presentation sets
- Users must create sets from scratch each time
- No way to save common set configurations
- No dropdown for quick set selection

**Current State:**
- Schema exists for presentation sets (`shared/schema.ts` line 425-436)
- No template or preset system
- Limited UI for set management

**User Requirements:**
1. Dropdown templates for common set types (e.g., "Match Day", "Post-Match", "Weekly Review")
2. Ability to save custom set configurations as templates
3. Quick selection and duplication of saved sets
4. Editable template names and descriptions

**Recommended Solution:**
- Add `setTemplates` table to schema
- Create UI for set template management
- Add "Load from Template" in PresentationSetManager
- Add "Save as Template" functionality
- Include template preview/description

---

### 5. 🟡 Production/Presentation System Functionality Issues
**Severity:** MEDIUM  
**Status:** Partially Functional

**Current State Analysis:**

✅ **Working Components:**
- Server-Sent Events (SSE) connection established successfully
- Live state management functional
- Scene switching between preview and program works
- Ticker toggle functionality works
- Transition effects selectable

⚠️ **Potential Issues:**
1. **Camera Integration:** Cameras don't persist when switching between Control/Sources tabs
2. **Scene Rendering:** VideoCompositor shows "No source configured" or "Not connected" messages frequently
3. **State Synchronization:** Some state updates may not broadcast properly via SSE
4. **Resource Management:** Camera streams not properly managed across component lifecycle

**Observed in Logs:**
- SSE client connects successfully: `Live SSE client connected`
- State updates work: `GET /api/live/state 200`
- Video sources can be created but connection state is fragile

**Recommended Actions:**
1. Improve camera connection persistence
2. Add better error states and user feedback
3. Implement reconnection logic for dropped camera streams
4. Add visual indicators for source health status

---

### 6. 🟢 Dropdown Names for Sources
**Severity:** LOW  
**Status:** Enhancement Request

**Problem:**
- Source names are simple text fields
- No predefined naming conventions
- No dropdown for selecting common source names

**User Requirements:**
- Dropdown with common source names (e.g., "Main Camera", "Guest Camera", "Screen Share")
- Ability to add custom names
- Save custom names for future use

**Recommended Solution:**
- Add `sourceNames` config table or use local storage
- Create combo-box (dropdown + text input) for source name field
- Pre-populate with common names
- Allow users to save custom names to the list

---

## Architecture Review

### Current Architecture Strengths:
1. ✅ Good separation of concerns (VideoCompositor, VideoSourceManager, LivePresentation)
2. ✅ SSE implementation for real-time updates
3. ✅ Proper use of React Query for state management
4. ✅ Canvas-based compositor for flexible rendering

### Architecture Weaknesses:
1. ❌ Camera stream management tied to component lifecycle
2. ❌ No persistence layer for templates/presets
3. ❌ Limited error handling and recovery mechanisms
4. ❌ No global state for camera connections

---

## Recommended Implementation Priority

### Phase 1 - Critical Fixes (Immediate)
1. **Fix camera disconnection issue** - Implement global camera manager
2. **Fix preview functionality** - Debug and improve user feedback
3. **Add source templates** - Schema + UI + persistence

### Phase 2 - High Priority (This Week)
4. **Add set templates** - Schema + UI + persistence
5. **Improve production system reliability** - Better error handling
6. **Add dropdown names** - Common source name presets

### Phase 3 - Enhancements (Future)
7. Add template import/export functionality
8. Add template sharing between users
9. Add template versioning

---

## Technical Debt Identified

1. **Camera Stream Management:** Needs architectural improvement to handle lifecycle properly
2. **Error Handling:** Many operations lack proper error states and user feedback
3. **State Persistence:** Templates and presets need proper database backing
4. **Browser Compatibility:** Camera access may have cross-browser issues
5. **Resource Cleanup:** Better cleanup needed for MediaStream objects

---

## Database Schema Changes Needed

### New Tables Required:

```typescript
// Source Templates
export const sourceTemplates = pgTable("source_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(''),
  sourceType: text("source_type").notNull(),
  configJson: jsonb("config_json").notNull().default('{}'),
  isDefault: boolean("is_default").notNull().default(false),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Set Templates
export const setTemplates = pgTable("set_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(''),
  sceneTemplateIds: text("scene_template_ids").array().notNull().default(sql`'{}'::text[]`),
  configJson: jsonb("config_json").notNull().default('{}'),
  isDefault: boolean("is_default").notNull().default(false),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Source Name Presets
export const sourceNamePresets = pgTable("source_name_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  category: text("category").notNull().default('Custom'),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});
```

---

## Testing Requirements

### Unit Tests Needed:
- [ ] Camera stream lifecycle management
- [ ] Template CRUD operations
- [ ] Preview functionality
- [ ] State synchronization

### Integration Tests Needed:
- [ ] Tab switching with active cameras
- [ ] Template loading and saving
- [ ] SSE state updates
- [ ] Multi-camera scenarios

### E2E Tests Needed:
- [ ] Full production workflow (create source → create scene → go live)
- [ ] Template creation and reuse workflow
- [ ] Camera reconnection after tab switch

---

## Conclusion

The Live Presentation System has a solid foundation but requires critical fixes for camera management and user experience improvements through template systems. The issues are fixable and the recommended solutions are achievable within the current architecture.

**Estimated Implementation Time:**
- Phase 1 (Critical): 2-3 days
- Phase 2 (High Priority): 2-3 days
- Phase 3 (Enhancements): 1-2 days

**Risk Level:** Medium - Issues are contained and solutions are well-defined
