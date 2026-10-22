import { StyleSheet } from 'react-native'
import { useTheme } from '../theme'

// The current theme and the chat's styles for it. Each theme's styles are built
// once and shared by every component.
const cache = new Map()

export function useStyles() {
  const theme = useTheme()
  if (!cache.has(theme)) {
    cache.set(theme, { theme, styles: makeStyles(theme), markdown: markdownStyles(theme) })
  }
  return cache.get(theme)
}

const markdownStyles = (t) => ({
  body: { color: t.text, fontSize: 16, lineHeight: 22 },
  paragraph: { marginTop: 0, marginBottom: 6 },
  bullet_list: { marginBottom: 6 },
  ordered_list: { marginBottom: 6 },
  strong: { fontWeight: '600' },
  link: { color: t.accent },
  code_inline: { backgroundColor: t.codeBg, color: t.text, borderRadius: 4, fontSize: 14 },
  fence: { backgroundColor: t.codeBg, color: t.text, borderWidth: 0, borderRadius: 8 },
  code_block: { backgroundColor: t.codeBg, color: t.text, borderWidth: 0, borderRadius: 8 }
})

const makeStyles = (t) =>
  StyleSheet.create({
    flex: { flex: 1 },
    screen: { flex: 1, backgroundColor: t.bg },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: t.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border
    },
    title: { fontSize: 17, fontWeight: '600', color: t.text },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.online },
    status: { fontSize: 12, color: t.muted },

    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      // Atomic's brand purple (indigo-500 on docs.atomicfi.com).
      backgroundColor: '#6035DB',
      alignItems: 'center',
      justifyContent: 'center'
    },
    avatarLarge: { width: 60, height: 60, borderRadius: 30 },
    avatarText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    avatarTextLarge: { fontSize: 24 },

    list: { padding: 16, gap: 14 },
    listEmpty: { flexGrow: 1, justifyContent: 'center' },

    row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    rowUser: { justifyContent: 'flex-end' },
    bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
    userBubble: { backgroundColor: t.accent, borderBottomRightRadius: 6 },
    userText: { color: t.accentText, fontSize: 16, lineHeight: 22 },
    agentBubble: {
      maxWidth: '100%',
      backgroundColor: t.agentBubble,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      borderBottomLeftRadius: 6,
      paddingBottom: 4
    },
    agentColumn: { flexShrink: 1, maxWidth: '80%', gap: 8, alignItems: 'flex-start' },
    actionBar: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
      backgroundColor: t.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border
    },
    actionButton: {
      backgroundColor: t.surface,
      minHeight: 60,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2
    },
    // Room on both sides for the logos, so the labels stay centered on the button.
    actionButtonLabels: { alignItems: 'center', paddingHorizontal: 40 },
    // Pins a logo to the button's left edge, vertically centered, outside the
    // labels' layout. actionLogoSlotRight moves it to the right edge.
    actionLogoSlot: {
      position: 'absolute',
      left: 14,
      top: 0,
      bottom: 0,
      justifyContent: 'center'
    },
    actionLogoSlotRight: { left: undefined, right: 14 },
    atomicLogo: { width: 36, height: 31 },
    // The company's logo on its own background color, like an app icon.
    actionLogo: {
      width: 36,
      height: 36,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    },
    actionLogoImage: { width: 28, height: 28 },
    actionButtonBusy: { opacity: 0.6 },
    actionButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
    actionButtonText: { color: t.text, fontSize: 18, fontWeight: '700' },
    actionButtonSub: { color: t.muted, fontSize: 12, marginTop: 2 },
    actionDone: {
      minHeight: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.bg,
      alignItems: 'center',
      justifyContent: 'center'
    },
    actionDoneText: { color: t.text, fontSize: 16, fontWeight: '600' },
    taskBubble: {
      maxWidth: '80%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingBottom: 10
    },
    taskIconSlot: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
    taskIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center'
    },
    taskIconText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
    taskText: { color: t.text, fontSize: 16, lineHeight: 22, flexShrink: 1 },
    taskTextBusy: { color: t.muted },
    // Fixed-width digits, so the label doesn't shift as the timer ticks.
    taskTimer: { fontVariant: ['tabular-nums'] },
    errorBubble: { backgroundColor: t.errorBg, borderColor: 'transparent', paddingBottom: 10 },
    errorText: { color: t.errorText, fontSize: 16, lineHeight: 22 },

    typing: { flexDirection: 'row', gap: 5, paddingVertical: 15, paddingBottom: 15 },
    typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.muted },

    welcome: { alignItems: 'center', paddingHorizontal: 12 },
    welcomeTitle: { fontSize: 24, fontWeight: '700', color: t.text, marginTop: 14 },
    welcomeText: {
      fontSize: 15,
      color: t.muted,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 18,
      lineHeight: 21
    },
    suggestions: { gap: 10, alignItems: 'center' },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surface
    },
    chipPressed: { borderColor: t.accent },
    chipText: { color: t.text, fontSize: 15 },

    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 12,
      paddingTop: 10,
      backgroundColor: t.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border
    },
    // Under the Transact bar, which already draws the divider.
    composerJoined: { borderTopWidth: 0 },
    input: {
      flex: 1,
      maxHeight: 140,
      minHeight: 42,
      paddingHorizontal: 16,
      paddingTop: 11,
      paddingBottom: 11,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.bg,
      color: t.text,
      fontSize: 16
    },
    send: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center'
    },
    sendDisabled: { opacity: 0.4 },
    sendPressed: { transform: [{ scale: 0.94 }] },
    sendIcon: { color: t.accentText, fontSize: 22, fontWeight: '700', marginTop: -2 }
  })
