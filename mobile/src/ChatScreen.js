import { useMemo, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useStyles } from './lib/styles'
import { useAgent } from './hooks/useAgent'
import ChatHeader from './components/ChatHeader'
import Composer from './components/Composer'
import Message from './components/Message'
import TransactBar from './components/TransactBar'
import TypingIndicator from './components/TypingIndicator'
import Welcome from './components/Welcome'

export default function ChatScreen() {
  const { styles } = useStyles()
  const { messages, busy, sendUserMessage, transactAction, handleTaskStatusUpdate } = useAgent()
  const [input, setInput] = useState('')
  const listRef = useRef(null)
  const canSend = !busy && input.trim() !== ''

  // Sends the user's message.
  function send(text) {
    text = text.trim()
    if (!text || busy) {
      return
    }
    setInput('')
    sendUserMessage(text)
    // Back to the newest message, in case the user had scrolled up.
    listRef.current?.scrollToOffset({ offset: 0, animated: true })
  }

  // Newest first, for the inverted list below. An inverted list is anchored to
  // its bottom edge, so the newest message and the typing indicator stay in view
  // when the keyboard or the Transact button takes up room.
  const thread = useMemo(() => [...messages].reverse(), [messages])

  return (
    <View style={styles.screen}>
      <ChatHeader />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {messages.length === 0 && !busy ? (
          // The welcome screen sits outside the inverted list, which would flip it.
          // It gives way to the list as soon as the agent is busy, so the typing
          // indicator shows even before the first message.
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.list, styles.listEmpty]}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
            <Welcome onPick={send} />
          </ScrollView>
        ) : (
          <FlatList
            ref={listRef}
            style={styles.flex}
            contentContainerStyle={styles.list}
            inverted
            data={thread}
            keyExtractor={(m) => m.id}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => <Message item={item} />}
            // In an inverted list the header renders at the bottom, under the newest message.
            ListHeaderComponent={busy ? <TypingIndicator /> : null}
          />
        )}

        {/* The latest Transact action, pinned above the composer. */}
        {transactAction && (
          <TransactBar
            // A new action starts fresh.
            key={transactAction.id}
            action={transactAction}
            onTaskStatusUpdate={handleTaskStatusUpdate}
          />
        )}

        <Composer
          value={input}
          onChangeText={setInput}
          onSend={() => send(input)}
          canSend={canSend}
          joined={Boolean(transactAction)}
        />
      </KeyboardAvoidingView>
    </View>
  )
}
