import { create } from 'zustand'
import { type Node, type Edge, applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange } from '@xyflow/react'
import type { Pipeline, Run, RunStatus, LogEntry, NodeStatus } from '@/types'
import type { NodeDef } from '@/lib/nodeRegistry'

interface EditorState {
  pipeline: Pipeline | null
  nodes: Node[]
  edges: Edge[]
  nodeTypes: NodeDef[]
  isDirty: boolean

  // Selected
  selectedNodeId: string | null

  // Run state
  activeRunId: string | null
  runStatus: RunStatus | null
  nodeStatuses: Record<string, NodeStatus>
  logs: LogEntry[]
  isRunning: boolean

  // Panels
  isInspectorOpen: boolean
  isConsoleOpen: boolean
  isAIChatOpen: boolean
  consoleTab: 'logs' | 'data' | 'schema'
  nodeDataTab: 'test' | 'pin' | 'schema'

  // Actions
  setPipeline: (p: Pipeline) => void
  setNodeTypes: (types: NodeDef[]) => void
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  setSelectedNode: (id: string | null) => void
  markDirty: () => void
  markClean: () => void

  setActiveRun: (runId: string) => void
  setRunStatus: (status: RunStatus) => void
  setNodeStatus: (nodeId: string, status: NodeStatus) => void
  appendLog: (log: LogEntry) => void
  clearLogs: () => void
  resetRun: () => void

  setInspectorOpen: (v: boolean) => void
  setConsoleOpen: (v: boolean) => void
  setAIChatOpen: (v: boolean) => void
  setConsoleTab: (tab: 'logs' | 'data' | 'schema') => void
  setNodeDataTab: (tab: 'test' | 'pin' | 'schema') => void
  /** Sélectionne un nœud et ouvre l'inspecteur sur un onglet de données précis. */
  inspectNodeData: (id: string, tab: 'test' | 'pin' | 'schema') => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  pipeline: null,
  nodes: [],
  edges: [],
  nodeTypes: [],
  isDirty: false,

  selectedNodeId: null,

  activeRunId: null,
  runStatus: null,
  nodeStatuses: {},
  logs: [],
  isRunning: false,

  isInspectorOpen: false,
  isConsoleOpen: false,
  isAIChatOpen: false,
  consoleTab: 'logs',
  nodeDataTab: 'test',

  setPipeline: (p) => {
    const nodes = (p.nodes ?? []) as unknown as Node[]
    const edges = (p.edges ?? []) as unknown as Edge[]
    set({ pipeline: p, nodes, edges, isDirty: false })
  },

  setNodeTypes: (types) => set({ nodeTypes: types }),

  setNodes: (nodes) => set({ nodes, isDirty: true }),

  setEdges: (edges) => set({ edges, isDirty: true }),

  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes), isDirty: true })),

  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges), isDirty: true })),

  setSelectedNode: (id) =>
    set({ selectedNodeId: id, isInspectorOpen: id !== null }),

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),

  setActiveRun: (runId) => set({ activeRunId: runId, isRunning: true, nodeStatuses: {}, logs: [] }),

  setRunStatus: (status) =>
    set({ runStatus: status, isRunning: status === 'running' || status === 'queued' }),

  setNodeStatus: (nodeId, status) =>
    set((state) => ({ nodeStatuses: { ...state.nodeStatuses, [nodeId]: status } })),

  appendLog: (log) =>
    set((state) => ({ logs: [...state.logs.slice(-499), log] })),

  clearLogs: () => set({ logs: [] }),

  resetRun: () =>
    set({ activeRunId: null, runStatus: null, nodeStatuses: {}, logs: [], isRunning: false }),

  setInspectorOpen: (v) => set({ isInspectorOpen: v }),
  setConsoleOpen: (v) => set({ isConsoleOpen: v }),
  setAIChatOpen: (v) => set({ isAIChatOpen: v }),
  setConsoleTab: (tab) => set({ consoleTab: tab }),
  setNodeDataTab: (tab) => set({ nodeDataTab: tab }),
  inspectNodeData: (id, tab) => set({ selectedNodeId: id, isInspectorOpen: true, nodeDataTab: tab }),
}))
