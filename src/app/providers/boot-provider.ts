import { setPresence } from '../../shared/api/presence-api'
import { usePush } from '../../shared/composables/use-push'

export async function initBootProviders(userId: string): Promise<string[]> {
  const push = usePush()
  const issues: string[] = []

  try {
    await setPresence(userId, true)
  } catch {
    issues.push('Presence не инициализирован')
  }

  try {
    await push.requestAndRegisterPush(userId)
  } catch {
    issues.push('Push не инициализирован')
  }

  return issues
}
