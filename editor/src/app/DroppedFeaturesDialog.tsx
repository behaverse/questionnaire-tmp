// editor/src/app/DroppedFeaturesDialog.tsx
import { Modal } from '../ui/Modal'

export function DroppedFeaturesDialog({ items, onClose }: { items: string[]; onClose: () => void }) {
  return (
    <Modal label="Exported with some features dropped" onClose={onClose}>
      <p className="text-sm text-ed-muted">
        The SurveyJS file was downloaded, but these features have no SurveyJS equivalent and were left out:
      </p>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </Modal>
  )
}
