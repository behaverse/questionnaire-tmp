import { useQuery } from '@tanstack/react-query'
import { api, type QuestionnaireQuery } from './client'

export const useQuestionnaires = (q: QuestionnaireQuery) =>
  useQuery({ queryKey: ['questionnaires', q], queryFn: () => api.listQuestionnaires(q) })

export const useQuestionSearch = (q: string | undefined, enabled = true) =>
  useQuery({ queryKey: ['question-search', q], queryFn: () => api.searchQuestions(q), enabled })

export const useFacets = (facetType: string) =>
  useQuery({ queryKey: ['facets', facetType], queryFn: () => api.facets(facetType) })

export const useStats = () =>
  useQuery({ queryKey: ['stats'], queryFn: () => api.stats(), staleTime: 5 * 60_000 })

export const useResolvedDefinition = (id: string, version: string | undefined, enabled = true) =>
  useQuery({
    queryKey: ['definition', id, version],
    queryFn: () => api.resolvedDefinition(id, version!),
    enabled: enabled && !!version,
  })

export const useVersions = (id: string) =>
  useQuery({ queryKey: ['versions', id], queryFn: () => api.versions(id) })
