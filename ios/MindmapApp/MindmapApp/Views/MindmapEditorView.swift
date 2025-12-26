import SwiftUI

struct MindmapEditorView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = MindmapEditorViewModel()
    @Environment(\.dismiss) var dismiss
    
    let mindmapId: String
    
    @State private var showNodeEditor = false
    @State private var showColorPicker = false
    @State private var editingNodeId: String?
    @State private var editingLabel = ""
    
    var body: some View {
        ZStack {
            // Canvas background
            Color(UIColor.systemGroupedBackground)
                .ignoresSafeArea()
            
            if viewModel.isLoading {
                ProgressView("Loading mindmap...")
            } else {
                // Main canvas with nodes
                MindmapCanvasView(viewModel: viewModel)
                    .ignoresSafeArea(edges: .bottom)
                
                // Floating toolbar
                VStack {
                    Spacer()
                    
                    floatingToolbar
                        .padding(.horizontal)
                        .padding(.bottom, 8)
                }
            }
        }
        .navigationTitle(viewModel.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: 12) {
                    if viewModel.hasChanges {
                        Text("Unsaved")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                    
                    Button {
                        Task {
                            if let token = authViewModel.accessToken {
                                await viewModel.saveMindmap(token: token)
                            }
                        }
                    } label: {
                        if viewModel.isSaving {
                            ProgressView()
                        } else {
                            Image(systemName: "square.and.arrow.down")
                        }
                    }
                    .disabled(viewModel.isSaving || !viewModel.hasChanges)
                }
            }
        }
        .sheet(isPresented: $showNodeEditor) {
            nodeEditorSheet
        }
        .sheet(isPresented: $showColorPicker) {
            colorPickerSheet
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK") {}
        } message: {
            Text(viewModel.error ?? "An error occurred")
        }
        .task {
            if let token = authViewModel.accessToken {
                await viewModel.loadMindmap(token: token, id: mindmapId)
            }
        }
    }
    
    private var floatingToolbar: some View {
        HStack(spacing: 12) {
            // Add node button
            Button {
                viewModel.addNode()
            } label: {
                Image(systemName: "plus")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(width: 44, height: 44)
                    .background(Color.blue)
                    .clipShape(Circle())
                    .shadow(radius: 4)
            }
            
            // Edit selected node
            if viewModel.selectedNodeId != nil {
                Button {
                    if let node = viewModel.selectedNode {
                        editingNodeId = node.id
                        editingLabel = node.data.label
                        showNodeEditor = true
                    }
                } label: {
                    Image(systemName: "pencil")
                        .font(.title3)
                        .foregroundColor(.white)
                        .frame(width: 44, height: 44)
                        .background(Color.green)
                        .clipShape(Circle())
                        .shadow(radius: 4)
                }
                
                // Color picker
                Button {
                    showColorPicker = true
                } label: {
                    Image(systemName: "paintpalette")
                        .font(.title3)
                        .foregroundColor(.white)
                        .frame(width: 44, height: 44)
                        .background(Color.purple)
                        .clipShape(Circle())
                        .shadow(radius: 4)
                }
                
                // Add child node
                Button {
                    viewModel.addNode(parentId: viewModel.selectedNodeId)
                } label: {
                    Image(systemName: "arrow.turn.down.right")
                        .font(.title3)
                        .foregroundColor(.white)
                        .frame(width: 44, height: 44)
                        .background(Color.orange)
                        .clipShape(Circle())
                        .shadow(radius: 4)
                }
                
                // Delete node
                Button {
                    viewModel.deleteSelectedNode()
                } label: {
                    Image(systemName: "trash")
                        .font(.title3)
                        .foregroundColor(.white)
                        .frame(width: 44, height: 44)
                        .background(Color.red)
                        .clipShape(Circle())
                        .shadow(radius: 4)
                }
            }
            
            Spacer()
            
            // Node count
            Text("\(viewModel.nodes.count) nodes")
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(.ultraThinMaterial)
                .cornerRadius(16)
        }
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(16)
        .shadow(radius: 8)
    }
    
    private var nodeEditorSheet: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Node Label", text: $editingLabel)
                } header: {
                    Text("Edit Node")
                }
            }
            .navigationTitle("Edit Node")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        showNodeEditor = false
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        if let nodeId = editingNodeId {
                            viewModel.updateNodeLabel(nodeId, label: editingLabel)
                        }
                        showNodeEditor = false
                    }
                    .disabled(editingLabel.isEmpty)
                }
            }
        }
        .presentationDetents([.medium])
    }
    
    private var colorPickerSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Node colors
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Node Color")
                            .font(.headline)
                        
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 6), spacing: 12) {
                            ForEach(viewModel.nodeColors, id: \.0) { color, name in
                                Button {
                                    viewModel.selectedColor = color
                                    if let nodeId = viewModel.selectedNodeId {
                                        viewModel.updateNodeColor(nodeId, color: color)
                                    }
                                } label: {
                                    Circle()
                                        .fill(Color(hex: color) ?? .blue)
                                        .frame(width: 44, height: 44)
                                        .overlay(
                                            Circle()
                                                .stroke(viewModel.selectedColor == color ? Color.primary : Color.clear, lineWidth: 3)
                                        )
                                }
                            }
                        }
                    }
                    
                    // Text colors
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Text Color")
                            .font(.headline)
                        
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 12) {
                            ForEach(viewModel.textColors, id: \.0) { color, name in
                                Button {
                                    viewModel.selectedTextColor = color
                                    if let nodeId = viewModel.selectedNodeId {
                                        viewModel.updateNodeTextColor(nodeId, textColor: color)
                                    }
                                } label: {
                                    Circle()
                                        .fill(Color(hex: color) ?? .white)
                                        .frame(width: 44, height: 44)
                                        .overlay(
                                            Circle()
                                                .stroke(Color.gray, lineWidth: 1)
                                        )
                                        .overlay(
                                            Circle()
                                                .stroke(viewModel.selectedTextColor == color ? Color.blue : Color.clear, lineWidth: 3)
                                        )
                                }
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Style")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        showColorPicker = false
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

// MARK: - Canvas View
struct MindmapCanvasView: View {
    @ObservedObject var viewModel: MindmapEditorViewModel
    
    @State private var offset = CGSize.zero
    @State private var lastOffset = CGSize.zero
    @State private var scale: CGFloat = 1.0
    @State private var lastScale: CGFloat = 1.0
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Grid background
                GridPattern()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 0.5)
                    .background(Color(UIColor.systemBackground))
                
                // Content
                ZStack {
                    // Edges
                    ForEach(viewModel.edges) { edge in
                        EdgeView(
                            edge: edge,
                            sourceNode: viewModel.nodes.first { $0.id == edge.source },
                            targetNode: viewModel.nodes.first { $0.id == edge.target }
                        )
                    }
                    
                    // Nodes
                    ForEach(viewModel.nodes) { node in
                        NodeView(
                            node: node,
                            isSelected: viewModel.selectedNodeId == node.id,
                            hasChildren: viewModel.nodeHasChildren(node.id),
                            onSelect: {
                                viewModel.selectNode(node.id)
                            },
                            onMove: { newPosition in
                                viewModel.updateNodePosition(node.id, position: newPosition)
                            },
                            onDoubleTap: {
                                // Could trigger edit mode
                            }
                        )
                    }
                }
                .offset(x: offset.width + geometry.size.width / 2 - 150,
                        y: offset.height + geometry.size.height / 2 - 100)
                .scaleEffect(scale)
            }
            .clipped()
            .gesture(
                MagnificationGesture()
                    .onChanged { value in
                        scale = lastScale * value
                    }
                    .onEnded { value in
                        lastScale = scale
                        scale = min(max(scale, 0.3), 3.0)
                        lastScale = scale
                    }
            )
            .simultaneousGesture(
                DragGesture()
                    .onChanged { value in
                        offset = CGSize(
                            width: lastOffset.width + value.translation.width,
                            height: lastOffset.height + value.translation.height
                        )
                    }
                    .onEnded { value in
                        lastOffset = offset
                    }
            )
            .onTapGesture {
                viewModel.selectNode(nil)
            }
        }
    }
}

// MARK: - Node View
struct NodeView: View {
    let node: MindmapNode
    let isSelected: Bool
    let hasChildren: Bool
    let onSelect: () -> Void
    let onMove: (NodePosition) -> Void
    let onDoubleTap: () -> Void
    
    @State private var dragOffset = CGSize.zero
    @State private var isDragging = false
    
    var nodeColor: Color {
        Color(hex: node.data.color ?? "#3b82f6") ?? .blue
    }
    
    var textColor: Color {
        Color(hex: node.data.textColor ?? "#ffffff") ?? .white
    }
    
    var body: some View {
        Text(node.data.label.isEmpty ? "New Node" : node.data.label)
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(textColor)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(nodeColor)
            .cornerRadius(20)
            .shadow(color: nodeColor.opacity(0.4), radius: isSelected ? 8 : 4, x: 0, y: 2)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(isSelected ? Color.primary : Color.clear, lineWidth: 2)
            )
            .overlay(
                // Child indicator
                Group {
                    if hasChildren {
                        Circle()
                            .fill(Color(UIColor.systemBackground))
                            .frame(width: 16, height: 16)
                            .overlay(
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 8, weight: .bold))
                                    .foregroundColor(.gray)
                            )
                            .shadow(radius: 2)
                            .offset(x: 8)
                    }
                },
                alignment: .trailing
            )
            .position(
                x: node.position.x + dragOffset.width,
                y: node.position.y + dragOffset.height
            )
            .gesture(
                DragGesture()
                    .onChanged { value in
                        isDragging = true
                        dragOffset = value.translation
                    }
                    .onEnded { value in
                        isDragging = false
                        let newPosition = NodePosition(
                            x: node.position.x + value.translation.width,
                            y: node.position.y + value.translation.height
                        )
                        onMove(newPosition)
                        dragOffset = .zero
                    }
            )
            .onTapGesture {
                onSelect()
            }
            .animation(.spring(response: 0.3), value: isSelected)
    }
}

// MARK: - Edge View
struct EdgeView: View {
    let edge: MindmapEdge
    let sourceNode: MindmapNode?
    let targetNode: MindmapNode?
    
    var body: some View {
        if let source = sourceNode, let target = targetNode {
            Path { path in
                let startPoint = CGPoint(x: source.position.x, y: source.position.y)
                let endPoint = CGPoint(x: target.position.x, y: target.position.y)
                
                // Bezier curve for smooth connection
                let controlPoint1 = CGPoint(
                    x: startPoint.x + (endPoint.x - startPoint.x) * 0.5,
                    y: startPoint.y
                )
                let controlPoint2 = CGPoint(
                    x: startPoint.x + (endPoint.x - startPoint.x) * 0.5,
                    y: endPoint.y
                )
                
                path.move(to: startPoint)
                path.addCurve(to: endPoint, control1: controlPoint1, control2: controlPoint2)
            }
            .stroke(Color.gray.opacity(0.5), style: StrokeStyle(lineWidth: 2, lineCap: .round))
        }
    }
}

// MARK: - Grid Pattern
struct GridPattern: Shape {
    let spacing: CGFloat = 30
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        
        // Vertical lines
        for x in stride(from: 0, to: rect.width, by: spacing) {
            path.move(to: CGPoint(x: x, y: 0))
            path.addLine(to: CGPoint(x: x, y: rect.height))
        }
        
        // Horizontal lines
        for y in stride(from: 0, to: rect.height, by: spacing) {
            path.move(to: CGPoint(x: 0, y: y))
            path.addLine(to: CGPoint(x: rect.width, y: y))
        }
        
        return path
    }
}

// MARK: - Color Extension
extension Color {
    init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
        
        var rgb: UInt64 = 0
        
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else {
            return nil
        }
        
        let r = Double((rgb & 0xFF0000) >> 16) / 255.0
        let g = Double((rgb & 0x00FF00) >> 8) / 255.0
        let b = Double(rgb & 0x0000FF) / 255.0
        
        self.init(red: r, green: g, blue: b)
    }
}

#Preview {
    NavigationStack {
        MindmapEditorView(mindmapId: "test-id")
            .environmentObject(AuthViewModel())
    }
}
