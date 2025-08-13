import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  Handle,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Database, Table, Key, Link } from 'lucide-react';

interface TableNode {
  id: string;
  name: string;
  comment: string;
  rows: number;
  size: number;
}

interface Relationship {
  from: string;
  to: string;
  fromColumn: string;
  toColumn: string;
  constraintName: string;
}

interface ForeignKey {
  column: string;
  references: string;
  referencedTable: string;
  referencedColumn: string;
  constraintName: string;
}

interface ERDData {
  tables: TableNode[];
  relationships: Relationship[];
  primaryKeys: Record<string, string[]>;
  foreignKeys: Record<string, ForeignKey[]>;
  dbName: string;
}

interface ERDVisualizationProps {
  erdData: ERDData;
}

// 커스텀 테이블 노드 컴포넌트
const TableNodeComponent = ({ data }: { data: any }) => {
  const borderClass = data.isSelected 
    ? "border-red-500 border-4 shadow-2xl" 
    : "border-blue-300 border-2 shadow-xl hover:border-blue-400";
    
  return (
    <div className={`bg-white rounded-lg min-w-[180px] max-w-[240px] relative group transition-all duration-300 ${borderClass}`}>
      {/* ReactFlow Handle 컴포넌트 - 명시적 연결점 */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: '#6B7280',
          width: '12px',
          height: '12px',
          border: '1px solid #3B82F6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: '#6B7280',
          width: '12px',
          height: '12px',
          border: '1px solid #3B82F6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          background: '#6B7280',
          width: '12px',
          height: '12px',
          border: '1px solid #3B82F6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: '#6B7280',
          width: '12px',
          height: '12px',
          border: '1px solid #3B82F6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />

      {/* 헤더 */}
      <div className="bg-gray-200 text-black px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-center space-x-2">
          <Table size={16} className="text-blue-400" />
          <div className="text-center">
            <h3 className="font-semibold text-sm">{data.name}</h3>
            {data.comment && <p className="text-xs text-gray-600 mt-1 truncate">{data.comment}</p>}
          </div>
        </div>
      </div>


      {/* Keys Section */}
      {((data.primaryKeys && data.primaryKeys.length > 0) || (data.foreignKeys && data.foreignKeys.length > 0)) && (
        <div className="px-4 py-3 border-b bg-gray-50">
          {/* Primary Keys */}
          {data.primaryKeys && data.primaryKeys.length > 0 && (
            <div className="space-y-0.5 mb-2">
              {data.primaryKeys.map((pk: string, index: number) => (
                <div key={index} className="text-xs text-gray-800 font-mono">
                  <span className="text-yellow-600 font-semibold text-[10px]">PK</span> {pk}
                </div>
              ))}
            </div>
          )}
          
          {/* Separator between PK and FK */}
          {data.primaryKeys && data.primaryKeys.length > 0 && data.foreignKeys && data.foreignKeys.length > 0 && (
            <div className="flex-1 h-px bg-gray-300 mb-2"></div>
          )}
          
          {/* Foreign Keys (excluding those that are also Primary Keys) */}
          {data.foreignKeys && data.foreignKeys.length > 0 && (
            <div className="space-y-0.5">
              {data.foreignKeys
                .filter((fk: any) => !data.primaryKeys?.includes(fk.column))
                .map((fk: any, index: number) => (
                  <div 
                    key={index} 
                    className="text-xs text-gray-800 font-mono"
                    title={`References: ${fk.referencedTable}.${fk.referencedColumn}`}
                  >
                    <span className="text-blue-600 font-semibold text-[10px]">FK</span> {fk.column}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 연결 정보 */}
      {data.connections > 0 && (
        <div className="px-4 py-2 bg-blue-50">
          <div className="flex items-center justify-center text-xs text-blue-600 font-medium">
            <Link size={12} className="mr-1" />
            {data.connections} FK Relationship{data.connections > 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  tableNode: TableNodeComponent,
};

const ERDVisualization: React.FC<ERDVisualizationProps> = ({ erdData }) => {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = React.useState<{ id: string; x: number; y: number; data: any } | null>(null);
  // 테이블을 컴팩트한 그리드로 배치하는 함수
  const generateLayout = useCallback((tables: TableNode[], relationships: Relationship[]) => {
    const nodeWidth = 300;
    const nodeHeight = 200;
    const spacing = 60;
    
    // 연결 관계 맵 생성
    const connectionMap = new Map<string, Set<string>>();
    tables.forEach(table => {
      connectionMap.set(table.name, new Set<string>());
    });
    
    relationships.forEach(rel => {
      if (connectionMap.has(rel.from) && connectionMap.has(rel.to)) {
        connectionMap.get(rel.from)!.add(rel.to);
        connectionMap.get(rel.to)!.add(rel.from);
      }
    });
    
    // 클러스터링: 연결된 테이블들을 그룹화
    const visited = new Set<string>();
    const clusters: string[][] = [];
    
    tables.forEach(table => {
      if (!visited.has(table.name)) {
        const cluster: string[] = [];
        const queue = [table.name];
        
        while (queue.length > 0) {
          const current = queue.shift()!;
          if (visited.has(current)) continue;
          
          visited.add(current);
          cluster.push(current);
          
          // 연결된 테이블들을 같은 클러스터에 추가
          const connections = connectionMap.get(current) || new Set();
          connections.forEach(connected => {
            if (!visited.has(connected)) {
              queue.push(connected);
            }
          });
        }
        
        if (cluster.length > 0) {
          clusters.push(cluster);
        }
      }
    });
    
    // 디버깅: 클러스터 정보 출력
    console.log('🔗 Found clusters:', clusters.map((cluster, index) => ({ 
      id: index, 
      size: cluster.length, 
      tables: cluster 
    })));
    
    // 클러스터별로 위치 배정
    const positions = new Map<string, {x: number, y: number}>();
    let currentY = 100;
    
    clusters.forEach((cluster, clusterIndex) => {
      const clusterCols = Math.ceil(Math.sqrt(cluster.length));
      let currentX = 100;
      
      cluster.forEach((tableName, index) => {
        const row = Math.floor(index / clusterCols);
        const col = index % clusterCols;
        
        const x = currentX + col * (nodeWidth + spacing);
        const y = currentY + row * (nodeHeight + spacing);
        
        positions.set(tableName, { x, y });
      });
      
      // 다음 클러스터는 오른쪽으로 이동
      const clusterWidth = clusterCols * (nodeWidth + spacing);
      currentX += clusterWidth + spacing;
      
      // 클러스터가 너무 오른쪽으로 가면 다음 줄로
      if (currentX > 1200) {
        currentY += Math.ceil(cluster.length / clusterCols) * (nodeHeight + spacing) + spacing;
        currentX = 100;
      }
    });
    
    // 테이블 순서대로 위치 반환
    return tables.map(table => {
      const pos = positions.get(table.name);
      return pos || { x: 100, y: 100 };
    });
  }, []);

  // 테이블을 컴팩트한 그리드로 배치하는 함수

  // 노드 데이터 생성
  const initialNodes: Node[] = useMemo(() => {
    const positions = generateLayout(erdData.tables, erdData.relationships);

    return erdData.tables
      .filter((table) => table && (table.id || table.name)) // null/undefined 테이블 필터링
      .map((table, index) => {
        // 더 강력한 ID 생성
        const nodeId =
          (table.id && table.id.toString().trim()) || (table.name && table.name.toString().trim()) || `table-${index}`;

        return {
          id: nodeId,
          type: 'tableNode',
          position: positions[index],
          data: {
            name: table.name || `Table ${index}`,
            comment: table.comment || '',
            rows: table.rows || 0,
            size: table.size || 0,
            primaryKeys: erdData.primaryKeys[table.name] || [],
            foreignKeys: erdData.foreignKeys[table.name] || [],
            connections: erdData.relationships.filter((rel) => rel.from === table.name || rel.to === table.name).length,
            isSelected: selectedNodeId === nodeId,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        };
      });
  }, [erdData, generateLayout, selectedNodeId]);

  // 엣지 데이터 생성 - initialNodes에 의존하도록 수정
  const initialEdges: Edge[] = useMemo(() => {
    // 유효한 테이블들만 필터링 (노드 생성과 동일한 로직)
    const validTables = erdData.tables.filter((table) => table && (table.id || table.name));

    // 테이블 쌍별로 관계들을 그룹화
    const relationshipGroups = new Map<string, Relationship[]>();
    erdData.relationships
      .filter((rel) => rel && rel.from && rel.to)
      .forEach((rel) => {
        const key = `${rel.from}-${rel.to}`;
        if (!relationshipGroups.has(key)) {
          relationshipGroups.set(key, []);
        }
        relationshipGroups.get(key)!.push(rel);
      });

    const validEdges = Array.from(relationshipGroups.entries()).map(([key, relationships], groupIndex) => {
      const rel = relationships[0]; // 첫 번째 관계를 대표로 사용
        // 유효한 테이블에서 매칭 찾기
        const sourceTable = validTables.find((t) => t.name === rel.from);
        const targetTable = validTables.find((t) => t.name === rel.to);

        if (!sourceTable || !targetTable) {
          console.warn(`❌ Skipping relationship ${groupIndex}: ${rel.from} -> ${rel.to} (table not found)`);
          return null;
        }

        // 노드 ID 생성 (노드 생성 로직과 완전히 동일)
        const sourceNodeId =
          (sourceTable.id && sourceTable.id.toString().trim()) ||
          (sourceTable.name && sourceTable.name.toString().trim()) ||
          `table-${validTables.indexOf(sourceTable)}`;
        const targetNodeId =
          (targetTable.id && targetTable.id.toString().trim()) ||
          (targetTable.name && targetTable.name.toString().trim()) ||
          `table-${validTables.indexOf(targetTable)}`;

        // 최종 검증
        if (!sourceNodeId || !targetNodeId || sourceNodeId === 'null' || targetNodeId === 'null') {
          console.warn(`❌ Invalid node IDs for relationship ${groupIndex}:`, { sourceNodeId, targetNodeId });
          return null;
        }

        // 기본 연결점 사용

        // 선택된 노드와 연결된 엣지인지 확인
        const isConnectedToSelected = selectedNodeId && (sourceNodeId === selectedNodeId || targetNodeId === selectedNodeId);
        const strokeWidth = isConnectedToSelected ? 5 : 2;
        const strokeColor = isConnectedToSelected ? '#16A34A' : '#3B82F6'; // 진한 연두색 vs 파란색

        const result = {
          id: `edge-${groupIndex}`,
          source: sourceNodeId,
          target: targetNodeId,
          type: 'smoothstep',
          animated: false, // 애니메이션 제거
          style: {
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: selectedNodeId && !isConnectedToSelected ? 0.3 : 1,
            strokeDasharray: 'none', // 실선으로 변경
          },
          markerEnd: {
            type: MarkerType.Circle,
            width: isConnectedToSelected ? 12 : 8,
            height: isConnectedToSelected ? 12 : 8,
            color: strokeColor,
          },
          markerStart: {
            type: MarkerType.Circle,
            width: isConnectedToSelected ? 10 : 6,
            height: isConnectedToSelected ? 10 : 6,
            color: strokeColor,
          },
          data: {
            // 모든 관계 정보를 저장
            relationships: relationships.map(r => ({
              constraint: r.constraintName,
              fromColumn: r.fromColumn,
              toColumn: r.toColumn,
            })),
            // 호환성을 위해 첫 번째 관계도 별도로 저장
            constraint: rel.constraintName,
            fromColumn: rel.fromColumn,
            toColumn: rel.toColumn,
          },
        };

        return result;
      })
      .filter(Boolean);

    return validEdges;
  }, [erdData.relationships, erdData.tables, initialNodes, selectedNodeId, generateLayout]); // 의존성 추가

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 노드가 완전히 로드된 후에 엣지를 설정
  React.useEffect(() => {
    if (initialNodes.length > 0 && initialEdges.length > 0) {
      // 짧은 딜레이 후에 엣지 설정
      const timer = setTimeout(() => {
        setEdges(initialEdges);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [initialNodes.length, initialEdges.length, setEdges, initialEdges]);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // 노드 클릭 핸들러
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('🔍 Node clicked:', node.id);
    setSelectedNodeId(prevSelected => {
      // 같은 노드를 다시 클릭하면 선택 해제
      if (prevSelected === node.id) {
        return null;
      }
      return node.id;
    });
  }, []);

  // 배경 클릭 시 선택 해제
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // 엣지 호버 핸들러 (선택된 노드의 연두색 엣지만 대상)
  const onEdgeMouseEnter = useCallback((event: React.MouseEvent, edge: any) => {
    // 선택된 노드와 연결된 엣지인지 확인
    const isConnectedToSelected = selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);
    
    if (isConnectedToSelected) {
      // ReactFlow 컨테이너의 바운딩 박스를 가져와서 상대 좌표로 변환
      const reactFlowBounds = (event.target as Element).closest('.react-flow')?.getBoundingClientRect();
      const containerX = reactFlowBounds?.left || 0;
      const containerY = reactFlowBounds?.top || 0;
      
      // 마우스 위치를 컨테이너 기준 좌표로 변환
      const relativeX = event.clientX - containerX;
      const relativeY = event.clientY - containerY;
      
      setHoveredEdge({
        id: edge.id,
        x: relativeX,
        y: relativeY,
        data: edge.data
      });
    }
  }, [selectedNodeId]);

  const onEdgeMouseLeave = useCallback(() => {
    setHoveredEdge(null);
  }, []);

  return (
    <div className="w-full h-full bg-gray-50">
      <div className="h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: false,
            minZoom: 0.1,
            maxZoom: 2,
          }}
          onInit={(reactFlowInstance) => {}}
          attributionPosition="bottom-left"
          defaultEdgeOptions={{
            style: {
              strokeWidth: 2,
              stroke: '#3B82F6',
              strokeDasharray: 'none',
            },
            type: 'smoothstep',
            animated: false,
            markerEnd: {
              type: MarkerType.Circle,
              width: 8,
              height: 8,
              color: '#3B82F6',
            },
            markerStart: {
              type: MarkerType.Circle,
              width: 6,
              height: 6,
              color: '#3B82F6',
            },
          }}
          connectionLineStyle={{ stroke: '#3B82F6', strokeWidth: 2 }}
          snapToGrid={true}
          snapGrid={[20, 20]}
        >
          <Background color="#e2e8f0" gap={20} size={1} variant="dots" />
          <Controls position="bottom-left" showInteractive={false} />
          <MiniMap
            nodeStrokeColor="#374151"
            nodeColor="#60A5FA"
            nodeBorderRadius={8}
            maskColor="rgba(0, 0, 0, 0.1)"
            position="top-right"
            style={{
              height: 120,
              width: 200,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          />
        </ReactFlow>
      </div>

      {/* 연두색 엣지 호버 시 툴팁 - ReactFlow 컨테이너 내부에 위치 */}
      {hoveredEdge && (
        <div
          className="absolute z-50 bg-black text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
          style={{
            position: 'absolute',
            left: hoveredEdge.x,
            top: hoveredEdge.y - 35,
            transform: 'translate(-50%, 0)',
            zIndex: 1000,
          }}
        >
          {hoveredEdge.data?.relationships && hoveredEdge.data.relationships.length > 1 ? (
            // 여러 관계가 있는 경우
            <div className="text-center">
              {hoveredEdge.data.relationships.map((rel: any, index: number) => (
                <div key={index} className="font-medium whitespace-nowrap">
                  {rel.fromColumn} → {rel.toColumn}
                </div>
              ))}
            </div>
          ) : (
            // 단일 관계인 경우
            <div className="font-medium text-center whitespace-nowrap">
              {hoveredEdge.data?.fromColumn} → {hoveredEdge.data?.toColumn}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ERDVisualization;
