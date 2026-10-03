import { contentRepository } from '../repositories/contentRepository.js'
import { httpError } from '../errors/httpError.js'
export function createContentService(repository: typeof contentRepository) {
  return {
    async get(slug: string) {
      const content = await repository.get(slug)
      if (!content) throw httpError(404, 'Page introuvable.')
      return content
    },
    list: repository.list,
    save: repository.save,
    subscribe: repository.subscribe,
    participants: repository.participants,
    async checkIn(secret: string, actorId: string) {
      const result = await repository.checkIn(secret, actorId)
      if (result.kind === 'invalid') throw httpError(404, 'Billet invalide.')
      if (result.kind === 'wrongDay')
        throw httpError(409, 'Le check-in est disponible uniquement le jour de l’activité.')
      if (result.kind === 'alreadyUsed') throw httpError(409, 'Billet déjà utilisé.')
      return result.booking
    },
  }
}
export const contentService = createContentService(contentRepository)
