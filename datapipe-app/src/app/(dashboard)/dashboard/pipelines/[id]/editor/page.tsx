import { PipelineEditor } from '@/components/editor/PipelineEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditorPage({ params }: Props) {
  const { id } = await params
  return <PipelineEditor pipelineId={id} />
}
