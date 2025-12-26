import Foundation
import SwiftUI

enum MindmapVisibility: String, Codable, CaseIterable {
    case PRIVATE
    case PUBLIC
    case SHARED
    
    var displayName: String {
        switch self {
        case .PRIVATE: return "Private"
        case .PUBLIC: return "Public"
        case .SHARED: return "Shared"
        }
    }
    
    var icon: String {
        switch self {
        case .PRIVATE: return "lock.fill"
        case .PUBLIC: return "globe"
        case .SHARED: return "person.2.fill"
        }
    }
}

struct Mindmap: Codable, Identifiable, Hashable {
    let id: String
    var title: String
    var description: String?
    var data: MindmapData
    var thumbnail: String?
    var visibility: MindmapVisibility
    var isFavorite: Bool
    var isArchived: Bool
    var shareToken: String?
    let createdAt: String
    let updatedAt: String
    let userId: String
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Mindmap, rhs: Mindmap) -> Bool {
        lhs.id == rhs.id
    }
    
    var formattedDate: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: updatedAt) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .short
            return displayFormatter.string(from: date)
        }
        return updatedAt
    }
}

struct MindmapData: Codable, Hashable {
    var nodes: [MindmapNode]
    var edges: [MindmapEdge]
    
    init(nodes: [MindmapNode] = [], edges: [MindmapEdge] = []) {
        self.nodes = nodes
        self.edges = edges
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.nodes = try container.decodeIfPresent([MindmapNode].self, forKey: .nodes) ?? []
        self.edges = try container.decodeIfPresent([MindmapEdge].self, forKey: .edges) ?? []
    }
}

struct MindmapNode: Codable, Identifiable, Equatable, Hashable {
    let id: String
    var type: String
    var position: NodePosition
    var data: NodeData
    var selected: Bool?
    
    init(id: String = UUID().uuidString, type: String = "mindmap", position: NodePosition, data: NodeData, selected: Bool? = nil) {
        self.id = id
        self.type = type
        self.position = position
        self.data = data
        self.selected = selected
    }
    
    static func == (lhs: MindmapNode, rhs: MindmapNode) -> Bool {
        lhs.id == rhs.id
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

struct NodePosition: Codable, Hashable {
    var x: Double
    var y: Double
    
    init(x: Double, y: Double) {
        self.x = x
        self.y = y
    }
}

struct NodeData: Codable, Hashable {
    var label: String
    var color: String?
    var textColor: String?
    var isCollapsed: Bool?
    var hasChildren: Bool?
    
    init(label: String, color: String? = nil, textColor: String? = nil, isCollapsed: Bool? = nil, hasChildren: Bool? = nil) {
        self.label = label
        self.color = color
        self.textColor = textColor
        self.isCollapsed = isCollapsed
        self.hasChildren = hasChildren
    }
}

struct MindmapEdge: Codable, Identifiable, Equatable, Hashable {
    let id: String
    var source: String
    var target: String
    var type: String?
    var animated: Bool?
    var style: EdgeStyle?
    var markerEnd: EdgeMarker?
    
    init(id: String = UUID().uuidString, source: String, target: String, type: String? = "smoothstep", animated: Bool? = false, style: EdgeStyle? = nil, markerEnd: EdgeMarker? = nil) {
        self.id = id
        self.source = source
        self.target = target
        self.type = type
        self.animated = animated
        self.style = style
        self.markerEnd = markerEnd
    }
    
    static func == (lhs: MindmapEdge, rhs: MindmapEdge) -> Bool {
        lhs.id == rhs.id
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

struct EdgeStyle: Codable, Hashable {
    var strokeWidth: Double?
    var stroke: String?
}

struct EdgeMarker: Codable, Hashable {
    var type: String?
    var color: String?
}

struct CreateMindmapRequest: Codable {
    let title: String
    let description: String?
    let data: MindmapData?
    let visibility: MindmapVisibility?
}

struct UpdateMindmapRequest: Codable {
    var title: String?
    var description: String?
    var data: MindmapData?
    var visibility: MindmapVisibility?
    var isFavorite: Bool?
    var isArchived: Bool?
}

struct MindmapsResponse: Codable {
    let data: [Mindmap]
    let total: Int
    let page: Int
    let limit: Int
}
