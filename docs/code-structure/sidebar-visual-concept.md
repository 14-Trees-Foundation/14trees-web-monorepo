# Component Hierarchy Sidebar - Visual Concept

## Desktop Layout Concept

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Donation Page - Component Hierarchy                       │
├─────────────────────────────────────────────────┬───────────────────────────┤
│                                                 │ 🌳 Component Tree    [×] │
│                                                 ├───────────────────────────┤
│  Main Donation Page Content                     │ 🔍 Search components...   │
│                                                 ├───────────────────────────┤
│  [Test Banner Component]                        │ ▼ 📄 Donation Page    ✅  │
│                                                 │   ├─ 🔧 Test Banner   ✅  │
│  ┌─────────────────────────────────────────────┐ │   ├─ ▼ 🎬 Motion...   ✅  │
│  │           Motion Container                  │ │   │   └─ 📊 Impact    ✅  │
│  │  ┌─────────────────────────────────────────┐│ │   ├─ 🌳 Location     ✅  │
│  │  │      Impact Information Section        ││ │   │   └─ 💰 Type      ✅  │
│  │  └─────────────────────────────────────────┘│ │   ├─ 👤 User Details ✅  │
│  └─────────────────────────────────────────────┘ │   │   └─ 📝 Form      ✅  │
│                                                 │   ├─ 🏷️ Names        ✅  │
│  [Tree Location Section]                        │   │   └─ 📤 CSV       ✅  │
│  [User Details Section]                         │   │       └─ 📁 Upload ✅  │
│  [Dedicated Names Section]                      │   ├─ ⚠️ Validation    ✅  │
│  [Payment Section]                              │   ├─ 💳 Payment      ✅  │
│                                                 │   │   └─ 📄 Summary   ✅  │
│                                                 │   ├─ 🎉 Success      ✅  │
│                                                 │   ├─ 👥 Referral     ✅  │
│                                                 │   └─ 📲 Invite       ✅  │
│                                                 ├───────────────────────────┤
│                                                 │ ⚙️ Hooks & Logic (11)    │
│                                                 │   ├─ ✅ Validation    ✅  │
│                                                 │   ├─ 💰 Payment      ✅  │
│                                                 │   ├─ 📊 CSV Process  ✅  │
│                                                 │   ├─ 🎯 Logic        ✅  │
│                                                 │   ├─ 📤 Submission   ✅  │
│                                                 │   ├─ 🏷️ Names        ✅  │
│                                                 │   ├─ 💳 Razorpay     ✅  │
│                                                 │   ├─ 🖼️ Images       ✅  │
│                                                 │   ├─ 🏦 Bank         ✅  │
│                                                 │   ├─ 📋 Step Valid   ✅  │
│                                                 │   └─ 🎛️ Handlers     ✅  │
│                                                 └───────────────────────────┘
└─────────────────────────────────────────────────────────────────────────────┘
```

## Mobile Layout Concept

### Collapsed State
```
┌─────────────────────────────────┐
│  Donation Page            [🌳] │ ← Floating button
├─────────────────────────────────┤
│                                 │
│  Main Content Area              │
│                                 │
│  [All donation components       │
│   displayed normally]           │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### Expanded State (Bottom Drawer)
```
┌─────────────────────────────────┐
│  Donation Page            [🌳] │
├─────────────────────────────────┤
│                                 │
│  Dimmed Main Content            │
│                                 │
├─────────────────────────────────┤
│ ═══ Component Tree ═══     [×] │ ← Drag handle
├─────────────────────────────────┤
│ 🔍 Search...                   │
├─────────────────────────────────┤
│ ▼ 📄 Donation Page         ✅  │
│   ├─ 🔧 Test Banner        ✅  │
│   ├─ 🎬 Motion Container   ✅  │
│   ├─ 🌳 Tree Location      ✅  │
│   ├─ 👤 User Details       ✅  │
│   ├─ 🏷️ Dedicated Names    ✅  │
│   ├─ 💳 Payment Section    ✅  │
│   └─ 🎉 Success Dialog     ✅  │
├─────────────────────────────────┤
│ ⚙️ Hooks (11 items)            │
└─────────────────────────────────┘
```

## Interactive States

### 1. Component Selection
```
│ ▼ 📄 Donation Page         ✅  │
│   ├─ 🔧 Test Banner        ✅  │
│   ├─ 🎬 Motion Container   ✅  │ ← Selected (highlighted)
│   │   └─ 📊 Impact Info    ✅  │   Shows description below
│   ├─ 🌳 Tree Location      ✅  │
│   └─ ...                       │
├─────────────────────────────────┤
│ 📝 Animated container with      │ ← Description panel
│     fade-in effects using       │
│     Framer Motion               │
│ 📁 /components/animation/       │
│     MotionDiv.tsx               │
└─────────────────────────────────┘
```

### 2. Search Results
```
├─────────────────────────────────┤
│ 🔍 payment                      │ ← Search term
├─────────────────────────────────┤
│ 📊 Search Results (3)           │
│   ├─ 💳 Payment Section     ✅  │ ← Filtered results
│   ├─ 💰 Payment Handling    ✅  │   only show matches
│   └─ 🏦 Bank Payment        ✅  │
├─────────────────────────────────┤
│ [Clear Search] [Show All]       │
└─────────────────────────────────┘
```

### 3. Component Status Indicators

```
│   ├─ 🔧 Test Banner        ✅  │ ← Exists and accessible
│   ├─ 🎬 Motion Container   ❌  │ ← File not found
│   ├─ 🌳 Tree Location      ⚠️  │ ← Warning (deprecated?)
│   ├─ 👤 User Details       🔄  │ ← Loading state
│   └─ 🏷️ Dedicated Names    ✨  │ ← Recently modified
```

## Color Scheme

### Light Theme
```css
--sidebar-bg: #fafafa
--sidebar-header: #001529
--tree-item-bg: #ffffff
--tree-item-hover: #f0f0f0
--tree-item-selected: #e6f7ff
--icon-color: #1890ff
--text-color: #262626
--border-color: #d9d9d9
```

### Dark Theme
```css
--sidebar-bg: #141414
--sidebar-header: #001529
--tree-item-bg: #1f1f1f
--tree-item-hover: #262626
--tree-item-selected: #111a2c
--icon-color: #1890ff
--text-color: #ffffff
--border-color: #434343
```

## Animations

### Sidebar Entry
```css
/* Slide in from right */
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Fade in overlay */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Tree Expand/Collapse
```css
/* Smooth height transition */
.tree-node-children {
  transition: height 0.3s ease;
  overflow: hidden;
}

/* Icon rotation */
.tree-expand-icon {
  transition: transform 0.2s ease;
}
.tree-expand-icon.expanded {
  transform: rotate(90deg);
}
```

## Accessibility Features

### Keyboard Navigation
```
Tab/Shift+Tab    - Navigate between interactive elements
Enter/Space      - Expand/collapse tree nodes
Arrow Up/Down    - Navigate tree items
Arrow Left/Right - Collapse/expand current node
Escape          - Close sidebar
Ctrl+F          - Focus search input
```

### Screen Reader Support
```html
<div role="tree" aria-label="Component hierarchy">
  <div role="treeitem" 
       aria-expanded="true" 
       aria-describedby="desc-1">
    📄 Donation Page
  </div>
  <div id="desc-1" className="sr-only">
    Main donation page with multi-step form and payment processing
  </div>
</div>
```

## Technical Implementation Notes

### Component Structure Preview
```typescript
// Main sidebar component
<ComponentHierarchySidebar>
  <SidebarHeader>
    <Title />
    <CloseButton />
  </SidebarHeader>
  
  <SearchInput />
  
  <TreeContainer>
    <AntdTree
      treeData={componentTreeData}
      expandedKeys={expandedKeys}
      selectedKeys={selectedKeys}
      onExpand={handleExpand}
      onSelect={handleSelect}
    />
  </TreeContainer>
  
  <ComponentDetails>
    {selectedComponent && (
      <ComponentDescription 
        component={selectedComponent} 
      />
    )}
  </ComponentDetails>
</ComponentHierarchySidebar>
```

### Data Flow
```
Component Analysis → Tree Data Transformation → Antd Tree Format → UI Rendering
        ↓                      ↓                      ↓              ↓
   Static mapping         Add icons &            Tree nodes     Interactive tree
   from our script        status checks          with metadata   with expand/collapse
```

---

This visual concept provides a clear picture of how the sidebar will look and behave across different devices and states. The next step would be team review and refinement of both the technical plan and visual design.