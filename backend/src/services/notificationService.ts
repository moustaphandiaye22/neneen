import { notificationRepository } from '../repositories/notificationRepository.js'
import {
  notificationProviders,
  type NotificationProvider,
} from '../providers/notificationProvider.js'
export function createNotificationService(
  repository: typeof notificationRepository,
  providers: Record<string, NotificationProvider>,
) {
  return {
    async dispatch() {
      await repository.releaseStuck()
      const batch = await repository.claim()
      for (const item of batch) {
        try {
          const provider = providers[item.channel]
          if (!provider) throw new Error('Canal non configuré.')
          await provider.send(item)
          await repository.sent(item.id)
        } catch {
          await repository.retry(item.id, item.attempts)
        }
      }
      return batch.length
    },
  }
}
export const notificationService = createNotificationService(
  notificationRepository,
  notificationProviders,
)
