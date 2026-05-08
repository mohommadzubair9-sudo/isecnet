import { useEffect, useState, useCallback } from 'react';
import { ReactFlow,
  Background, Controls, MiniMap, Node, Edge,
  BackgroundVariant, useNodesState, useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Info, X } from 'lucide-react';
import API from '../api/client';

const RISK_COLORS: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#3b82f6', MINIMAL: '#22c55e' };
const SOURCE_ICONS: Record<string, string> = { AWS: '☁️', GITHUB: '🐙', KUBERNETES: '⚓', SAAS: '🔌', 'AI-AGENT': '🤖' };

function SourceNode({ data }: { data: any }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl text-white text-center min-w-[100px]"
      style={{ background: `${data.color}22`, border: `2px solid ${data.color}`, boxShadow: `0 0 20px ${data.color}33` }}>
      <div className="text-2xl">{SOURCE_ICONS[data.label] || '🔑'}</div>
      <div className="font-bold text-xs" style={{ color: data.color }}>{data.label}</div>
      <div className="text-xs text-gray-400">{data.count} credentials</div>
    </div>
  );
}

function CredentialNode({ data }: { data: any }) {
  const color = RISK_COLORS[data.riskLevel] || '#6b7280';
  return (
    <div className="px-3 py-2 rounded-lg text-center min-w-[110px] max-w-[140px]"
      style={{ background: '#111827', border: `1.5px solid ${color}`, boxShadow: data.riskLevel === 'CRITICAL' ? `0 0 12px ${color}44` : 'none' }}>
      <div className="text-xs font-medium text-white truncate" title={data.label}>{data.label}</div>
      <div className="flex items-center justify-center gap-1 mt-1">
        <span className="text-xs font-bold" style={{ color }}>{data.riskScore}</span>
        <span className="text-xs" style={{ color, fontSize: '0.6rem' }}>{data.riskLevel}</span>
      </div>
    </div>
  );
}

const nodeTypes = { sourceNode: SourceNode, credentialNode: CredentialNode };

export default function IdentityGraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [filterRisk, setFilterRisk] = useState('');

  useEffect(() => {
    API.get('/graph/nodes').then((r) => {
      setNodes(r.data.nodes);
      setEdges(r.data.edges);
    }).finally(() => setLoading(false));
  }, []);

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (node.data.riskLevel) setSelectedNode(node.data);
  }, []);

  const filteredNodes = filterRisk
    ? nodes.map((n) => ({ ...n, hidden: n.type === 'credentialNode' && n.data.riskLevel !== filterRisk }))
    : nodes;

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 48px)', marginTop: '-24px', marginLeft: '-24px', marginRight: '-24px', position: 'relative' }}>
      {/* Controls overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 flex-wrap">
        <div className="text-sm font-bold text-white px-3 py-2 rounded-lg" style={{ background: '#0d1426', border: '1px solid #1f2937' }}>
          Identity Graph
        </div>
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'].map((r) => (
          <button key={r} onClick={() => setFilterRisk(filterRisk === r ? '' : r)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
            style={{
              background: filterRisk === r ? `${RISK_COLORS[r]}22` : '#0d1426',
              color: filterRisk === r ? RISK_COLORS[r] : '#6b7280',
              borderColor: filterRisk === r ? RISK_COLORS[r] : '#1f2937',
            }}>
            {r}
          </button>
        ))}
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-10 card p-4 w-64">
          <div className="flex items-start justify-between mb-3">
            <div className="text-sm font-bold text-white pr-2">{selectedNode.label}</div>
            <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white flex-shrink-0"><X size={14} /></button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Risk Level</span><span className={`badge badge-${selectedNode.riskLevel?.toLowerCase()}`}>{selectedNode.riskLevel}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Risk Score</span><span className="font-bold" style={{ color: RISK_COLORS[selectedNode.riskLevel] }}>{selectedNode.riskScore}/100</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="text-white">{selectedNode.type?.replace(/_/g, ' ')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Source</span><span className="text-white uppercase">{selectedNode.source}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`badge badge-${selectedNode.status?.toLowerCase()}`}>{selectedNode.status}</span></div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="spinner w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-3" />
            Building identity graph...
          </div>
        </div>
      ) : (
        <ReactFlow
          nodes={filteredNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          style={{ background: '#0a0f1e' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1f2937" />
          <Controls style={{ background: '#0d1426', border: '1px solid #1f2937', borderRadius: 8 }} />
          <MiniMap style={{ background: '#0d1426', border: '1px solid #1f2937' }} nodeColor={(n) => RISK_COLORS[n.data?.riskLevel as string] || '#6366f1'} maskColor="rgba(10,15,30,0.7)" />
        </ReactFlow>
      )}
    </div>
  );
}
