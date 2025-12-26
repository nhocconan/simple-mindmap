import Foundation
import SwiftUI

@MainActor
class MindmapEditorViewModel: ObservableObject {
    @Published var mindmap: Mindmap?
    @Published var nodes: [MindmapNode] = []
    @Published var edges: [MindmapEdge] = []
    @Published var selectedNodeId: String?
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var hasChanges = false
    @Published var error: String?
    @Published var showError = false
    @Published var title: String = ""
    
    // For node styling
    @Published var selectedColor = "#3b82f6"
    @Published var selectedTextColor = "#ffffff"
    
    // Canvas properties
    @Published var canvasOffset = CGSize.zero
    @Published var canvasScale: CGFloat = 1.0
    
    private let api = APIService.shared
    
    let nodeColors = [
        ("#3b82f6", "Blue"),
        ("#10b981", "Green"),
        ("#f59e0b", "Orange"),
        ("#ef4444", "Red"),
        ("#8b5cf6", "Purple"),
        ("#ec4899", "Pink"),
        ("#06b6d4", "Cyan"),
        ("#6366f1", "Indigo"),
        ("#84cc16", "Lime"),
        ("#14b8a6", "Teal"),
        ("#64748b", "Slate"),
        ("#1e293b", "Dark")
    ]
    
    let textColors = [
        ("#ffffff", "White"),
        ("#000000", "Black"),
        ("#374151", "Gray"),
        ("#9ca3af", "Light Gray")
    ]
    
    var selectedNode: MindmapNode? {
        nodes.first { $0.id == selectedNodeId }
    }
    
    func loadMindmap(token: String, id: String) async {
        isLoading = true
        
        do {
            let mindmap = try await api.getMindmap(token: token, id: id)
            self.mindmap = mindmap
            self.title = mindmap.title
            self.nodes = mindmap.data.nodes
            self.edges = mindmap.data.edges
            hasChanges = false
        } catch {
            self.error = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func saveMindmap(token: String) async {
        guard let mindmap = mindmap else { return }
        
        isSaving = true
        
        do {
            let data = MindmapData(nodes: nodes, edges: edges)
            let updated = try await api.updateMindmap(token: token, id: mindmap.id, title: title, data: data)
            self.mindmap = updated
            hasChanges = false
        } catch {
            self.error = error.localizedDescription
            showError = true
        }
        
        isSaving = false
    }
    
    func addNode(parentId: String? = nil) {
        let parentNode = parentId != nil ? nodes.first { $0.id == parentId } : selectedNode
        
        let newPosition: NodePosition
        if let parent = parentNode {
            newPosition = NodePosition(
                x: parent.position.x + 200,
                y: parent.position.y + Double.random(in: -50...50)
            )
        } else {
            newPosition = NodePosition(
                x: Double.random(in: 100...400),
                y: Double.random(in: 100...300)
            )
        }
        
        let newNode = MindmapNode(
            id: "node-\(Date().timeIntervalSince1970)",
            position: newPosition,
            data: NodeData(
                label: "New Node",
                color: selectedColor,
                textColor: selectedTextColor
            )
        )
        
        nodes.append(newNode)
        
        if let parent = parentNode {
            let newEdge = MindmapEdge(
                id: "edge-\(Date().timeIntervalSince1970)",
                source: parent.id,
                target: newNode.id,
                type: "smoothstep",
                style: EdgeStyle(strokeWidth: 2, stroke: "#94a3b8"),
                markerEnd: EdgeMarker(type: "arrowclosed", color: "#94a3b8")
            )
            edges.append(newEdge)
        }
        
        selectedNodeId = newNode.id
        hasChanges = true
    }
    
    func updateNodeLabel(_ nodeId: String, label: String) {
        if let index = nodes.firstIndex(where: { $0.id == nodeId }) {
            nodes[index].data.label = label
            hasChanges = true
        }
    }
    
    func updateNodePosition(_ nodeId: String, position: NodePosition) {
        if let index = nodes.firstIndex(where: { $0.id == nodeId }) {
            nodes[index].position = position
            hasChanges = true
        }
    }
    
    func updateNodeColor(_ nodeId: String, color: String) {
        if let index = nodes.firstIndex(where: { $0.id == nodeId }) {
            nodes[index].data.color = color
            hasChanges = true
        }
    }
    
    func updateNodeTextColor(_ nodeId: String, textColor: String) {
        if let index = nodes.firstIndex(where: { $0.id == nodeId }) {
            nodes[index].data.textColor = textColor
            hasChanges = true
        }
    }
    
    func deleteNode(_ nodeId: String) {
        nodes.removeAll { $0.id == nodeId }
        edges.removeAll { $0.source == nodeId || $0.target == nodeId }
        if selectedNodeId == nodeId {
            selectedNodeId = nil
        }
        hasChanges = true
    }
    
    func deleteSelectedNode() {
        guard let nodeId = selectedNodeId else { return }
        deleteNode(nodeId)
    }
    
    func connectNodes(sourceId: String, targetId: String) {
        // Check if connection already exists
        guard !edges.contains(where: { $0.source == sourceId && $0.target == targetId }) else { return }
        guard sourceId != targetId else { return }
        
        let newEdge = MindmapEdge(
            id: "edge-\(Date().timeIntervalSince1970)",
            source: sourceId,
            target: targetId,
            type: "smoothstep",
            style: EdgeStyle(strokeWidth: 2, stroke: "#94a3b8"),
            markerEnd: EdgeMarker(type: "arrowclosed", color: "#94a3b8")
        )
        edges.append(newEdge)
        hasChanges = true
    }
    
    func selectNode(_ nodeId: String?) {
        selectedNodeId = nodeId
    }
    
    func applyColorToSelected() {
        guard let nodeId = selectedNodeId else { return }
        updateNodeColor(nodeId, color: selectedColor)
        updateNodeTextColor(nodeId, textColor: selectedTextColor)
    }
    
    // Get children of a node
    func getChildNodeIds(_ nodeId: String) -> [String] {
        edges.filter { $0.source == nodeId }.map { $0.target }
    }
    
    // Check if node has children
    func nodeHasChildren(_ nodeId: String) -> Bool {
        edges.contains { $0.source == nodeId }
    }
}
