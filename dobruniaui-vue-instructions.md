# LLM Instructions

This file is generated and intended for AI assistants and automation tools.

Generated on: 2026-03-04T17:18:14.002Z

## Package Facts

- Package: `dobruniaui-vue`
- Version: `2.0.5`
- ESM import entry: `./dist/dobruniaui.mjs`
- CJS require entry: `./dist/dobruniaui.cjs`
- Types entry: `./dist/index.d.ts`

## Recommended Usage For Consumers

- Strong recommendation: use named imports for tree-shaking by default.
- Preferred import pattern: `import { DbrButton, DbrInput } from "dobruniaui-vue"`.
- Import styles once: `import "dobruniaui-vue/styles.css"`.
- Avoid `app.use(DobruniaUI)` unless you explicitly want global registration of all components.

```ts
import { DbrButton, DbrInput } from "dobruniaui-vue";
import "dobruniaui-vue/styles.css";
```

## Design System Rules (Short)

- Reuse primitives and variants; avoid page-specific shortcuts.
- Colors/radii/spacing should come from CSS variables and tokens.
- Prefer existing utility classes (`dbru-text-*`, `dbru-btn*`, `dbru-size-*`).
- Keep semantic shortcuts alias-only (no unique visual styles).

## Reusable Classes From base.css

- `dbru-bg`
- `dbru-btn`
- `dbru-btn--danger`
- `dbru-btn--ghost`
- `dbru-btn--primary`
- `dbru-focusable`
- `dbru-reduced-motion`
- `dbru-root`
- `dbru-size-lg`
- `dbru-size-md`
- `dbru-size-sm`
- `dbru-surface`
- `dbru-text-base`
- `dbru-text-lg`
- `dbru-text-main`
- `dbru-text-muted`
- `dbru-text-on-danger`
- `dbru-text-on-primary`
- `dbru-text-sm`
- `dbru-text-xs`

## Design Tokens From tokens.css

- `--dbru-color-bg`
- `--dbru-color-border`
- `--dbru-color-danger`
- `--dbru-color-error`
- `--dbru-color-focus`
- `--dbru-color-on-danger`
- `--dbru-color-on-primary`
- `--dbru-color-primary`
- `--dbru-color-success`
- `--dbru-color-surface`
- `--dbru-color-text`
- `--dbru-control-height-lg`
- `--dbru-control-height-md`
- `--dbru-control-height-sm`
- `--dbru-duration-base`
- `--dbru-duration-fast`
- `--dbru-ease-standard`
- `--dbru-font-family`
- `--dbru-font-size-base`
- `--dbru-font-size-lg`
- `--dbru-font-size-sm`
- `--dbru-font-size-xs`
- `--dbru-font-weight-semibold`
- `--dbru-line-height-base`
- `--dbru-line-height-tight`
- `--dbru-radius-md`
- `--dbru-radius-sm`
- `--dbru-shadow-md`
- `--dbru-shadow-sm`
- `--dbru-space-1`
- `--dbru-space-2`
- `--dbru-space-3`
- `--dbru-space-4`
- `--dbru-space-5`
- `--dbru-space-6`

## Components And Props

## Named Type Aliases

This section lists exported reusable type aliases (enums/unions) used by component props.

| Type | Definition | Source |
| --- | --- | --- |
| `DbrAttachmentKind` | `"image" \| "file" \| "audio"` | `DbrChatComposer` |
| `DbrBadgeVariant` | `"primary" \| "ghost" \| "danger"` | `DbrBadge` |
| `DbrButtonSize` | `"sm" \| "md" \| "lg"` | `DbrButton` |
| `DbrButtonVariant` | `"primary" \| "ghost" \| "danger"` | `DbrButton` |
| `DbrCardVariant` | `"surface" \| "bordered"` | `DbrCard` |
| `DbrChatBubbleDirection` | `"in" \| "out"` | `DbrChatBubble` |
| `DbrChatBubbleKind` | `"text" \| "image" \| "audio"` | `DbrChatBubble` |
| `DbrChatBubbleStatus` | `"none" \| "sending" \| "sent" \| "read"` | `DbrChatBubble` |
| `DbrIconButtonSize` | `"sm" \| "md" \| "lg"` | `DbrIconButton` |
| `DbrIconButtonVariant` | `"primary" \| "ghost" \| "danger"` | `DbrIconButton` |
| `DbrMessageStatus` | `"unread" \| "read" \| "error"` | `DbrChatListItem` |
| `DbrMessageType` | `"text" \| "image" \| "file" \| "voice"` | `DbrChatListItem` |
| `DbrPresence` | `"online" \| "away" \| "offline"` | `DbrChatListItem` |

### DbrAvatar

Source interface: `DbrAvatarProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | `undefined` | /** Image source. / |
| `alt` | `string` | `undefined` | /** Alt text for the image. / |
| `name` | `string` | `""` | /** Name used to generate initials fallback. / |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | /** Avatar size. / |
| `shape` | `"circle" \| "rounded"` | `"circle"` | /** Avatar shape. / |

### DbrBadge

Source interface: `DbrBadgeProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | `"Badge"` | /** Badge text. / |
| `variant` | `DbrBadgeVariant` | `"primary"` | /** Visual style of the badge. / |

### DbrButton

Source interface: `DbrButtonProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `DbrButtonVariant` | `"primary"` | /** Visual style of the button. / |
| `size` | `DbrButtonSize` | `"md"` | /** Button size scale. / |
| `disabled` | `boolean` | `false` | /** Disables the button and removes pointer interaction. / |
| `pressed` | `boolean` | `undefined` | /** Use for toggle buttons to communicate pressed state to screen readers. / |
| `nativeType` | `"button" \| "submit" \| "reset"` | `"button"` | /** Native HTML button type. / |

### DbrCard

Source interface: `DbrCardProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `"div" \| "section" \| "article"` | `"div"` | /** HTML tag used as card root element. / |
| `variant` | `DbrCardVariant` | `"surface"` | /** Visual style of the card. / |
| `disabled` | `boolean` | `false` | /** Disables hover and interactions. / |
| `hoverable` | `boolean` | `false` | /** Enables hover highlight effect. / |

### DbrChatBubble

Source interface: `DbrChatBubbleProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | `"Message text"` | /** Message text. / |
| `kind` | `DbrChatBubbleKind` | `"text"` | /** Message kind. / |
| `mediaSrc` | `string` | `""` | /** Media source (image or audio). / |
| `time` | `string` | `"12:45"` | /** Time label. / |
| `direction` | `DbrChatBubbleDirection` | `"in"` | /** Direction of the message. / |
| `status` | `DbrChatBubbleStatus` | `"none"` | /** Message status for checkmarks. / |

### DbrChatComposer

Source interface: `DbrChatComposerProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | `""` | /** Message text for v-model. / |
| `placeholder` | `string` | `"Message"` | /** Placeholder text for the input. / |
| `ariaLabel` | `string` | `"Message"` | /** Accessible label for the textarea. / |
| `disabled` | `boolean` | `false` | /** Disable composer controls. / |
| `maxHeight` | `number` | `120` | /** Max height for auto-growing textarea (px). / |

### DbrChatListItem

Source interface: `DbrChatListItemProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `undefined` | /** Unique chat id. / |
| `avatar` | `string` | `undefined` | /** Avatar image source. / |
| `avatarAlt` | `string` | `undefined` | /** Avatar alt text. / |
| `avatarShape` | `"circle" \| "rounded"` | `"circle"` | /** Avatar shape. / |
| `name` | `string` | `"User"` | /** Display name. / |
| `lastMessage` | `{ text?: string` | `{ text: "Last message...", type: "text" }` | /** Last message object. / |
| `type` | `DbrMessageType` | `—` | — |
| `authorName` | `string` | `—` | — |
| `timestamp` | `number \| Date` | `undefined` | /** Timestamp of last message. / |
| `messageStatus` | `DbrMessageStatus` | `"read"` | /** Message status (incoming only). / |
| `isOutgoing` | `boolean` | `false` | /** Whether the last message is outgoing. / |
| `status` | `DbrPresence` | `"offline"` | /** User presence status. / |
| `unreadCount` | `number` | `0` | /** Unread count badge (incoming only). / |
| `isTyping` | `boolean` | `false` | /** Shows typing indicator. / |
| `loading` | `boolean` | `false` | /** Shows loading skeleton when true. / |

### DbrCheckbox

Source interface: `DbrCheckboxProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | `false` | /** Checked state for v-model. / |
| `disabled` | `boolean` | `false` | /** Disables the checkbox and removes pointer interaction. / |
| `label` | `string` | `undefined` | /** Optional label text. You can also use the default slot. / |
| `name` | `string` | `undefined` | /** Native name attribute for form submission. / |
| `value` | `string` | `undefined` | /** Native value attribute for form submission. / |

### DbrIconButton

Source interface: `DbrIconButtonProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | `undefined` | /** Button text label. Leave empty for square icon-only mode. / |
| `variant` | `DbrIconButtonVariant` | `"primary"` | /** Visual style of the button. / |
| `size` | `DbrIconButtonSize` | `"md"` | /** Button size. / |
| `disabled` | `boolean` | `false` | /** Disables the button and removes pointer interaction. / |
| `nativeType` | `"button" \| "submit" \| "reset"` | `"button"` | /** Native HTML button type. / |
| `iconPosition` | `"start" \| "end"` | `"start"` | /** Icon position relative to text. / |

### DbrInput

Source interface: `DbrInputProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | `""` | /** Input value for v-model. / |
| `label` | `string` | `undefined` | /** Input label text. You can also use the default slot. / |
| `size` | `'sm' \| 'md' \| 'lg'` | `"md"` | /** Input size. / |
| `type` | `string` | `"text"` | /** Native input type. / |
| `iconPosition` | `'left' \| 'right'` | `"left"` | /** Position of custom icon slot. / |
| `name` | `string` | `undefined` | /** Native name attribute for form submission. / |
| `id` | `string` | `undefined` | /** Native id used to connect input and label. / |
| `disabled` | `boolean` | `false` | /** Disables the input and removes pointer interaction. / |
| `required` | `boolean` | `false` | /** Marks input as required. / |
| `autocomplete` | `string` | `undefined` | /** Native autocomplete attribute. / |

### DbrLoader

Source interface: `DbrLoaderProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | /** Loader size from global control scale. / |

### DbrThemeToggle

Source interface: `DbrThemeToggleProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | `false` | /** Whether dark theme is enabled. / |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | /** Control size from global size scale. / |
| `shape` | `"circle" \| "rounded"` | `"circle"` | /** Toggle button shape. / |
| `persist` | `boolean` | `true` | /** Persist choice to localStorage. / |
| `storageKey` | `string` | `"dbru-theme"` | /** Storage key for persistence. / |

### DbrToggle

Source interface: `DbrToggleProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | `false` | /** Checked state for v-model. / |
| `disabled` | `boolean` | `false` | /** Disables the toggle and removes pointer interaction. / |
| `label` | `string` | `undefined` | /** Optional label text. You can also use the default slot. / |
| `id` | `string` | `undefined` | /** Native id used to connect input and label. / |
| `name` | `string` | `undefined` | /** Native name attribute for form submission. / |
| `value` | `string` | `undefined` | /** Native value attribute for form submission. / |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | /** Toggle size from global control scale. / |

### DbrTooltip

Source interface: `DbrTooltipProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | `"This is a cool tooltip!"` | /** Tooltip text content. / |
| `variant` | `"info" \| "warning" \| "error" \| "success"` | `undefined` | /** Tooltip visual variant. / |
