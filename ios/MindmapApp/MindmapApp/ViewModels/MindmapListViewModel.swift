import Foundation
import SwiftUI

@MainActor
class MindmapListViewModel: ObservableObject {
    @Published var mindmaps: [Mindmap] = []
    @Published var isLoading = false
    @Published var isRefreshing = false
    @Published var error: String?
    @Published var showError = false
    @Published var searchText = ""
    @Published var showFavoritesOnly = false
    @Published var showArchived = false
    
    private let api = APIService.shared
    private var currentPage = 1
    private var hasMorePages = true
    
    func loadMindmaps(token: String) async {
        isLoading = true
        currentPage = 1
        
        do {
            let response = try await api.getMindmaps(
                token: token,
                page: currentPage,
                search: searchText.isEmpty ? nil : searchText,
                isFavorite: showFavoritesOnly ? true : nil,
                isArchived: showArchived ? true : false
            )
            mindmaps = response.data
            hasMorePages = response.data.count >= response.limit
        } catch {
            self.error = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func refresh(token: String) async {
        isRefreshing = true
        await loadMindmaps(token: token)
        isRefreshing = false
    }
    
    func loadMore(token: String) async {
        guard !isLoading && hasMorePages else { return }
        
        currentPage += 1
        
        do {
            let response = try await api.getMindmaps(
                token: token,
                page: currentPage,
                search: searchText.isEmpty ? nil : searchText,
                isFavorite: showFavoritesOnly ? true : nil,
                isArchived: showArchived ? true : false
            )
            mindmaps.append(contentsOf: response.data)
            hasMorePages = response.data.count >= response.limit
        } catch {
            currentPage -= 1
        }
    }
    
    func createMindmap(token: String, title: String, description: String? = nil) async -> Mindmap? {
        do {
            let defaultData = MindmapData(nodes: [
                MindmapNode(
                    id: "node-\(Date().timeIntervalSince1970)",
                    position: NodePosition(x: 300, y: 200),
                    data: NodeData(label: "Central Idea", color: "#3b82f6", textColor: "#ffffff")
                )
            ], edges: [])
            
            let mindmap = try await api.createMindmap(token: token, title: title, description: description, data: defaultData)
            mindmaps.insert(mindmap, at: 0)
            return mindmap
        } catch {
            self.error = error.localizedDescription
            showError = true
            return nil
        }
    }
    
    func deleteMindmap(token: String, id: String) async {
        do {
            try await api.deleteMindmap(token: token, id: id)
            mindmaps.removeAll { $0.id == id }
        } catch {
            self.error = error.localizedDescription
            showError = true
        }
    }
    
    func toggleFavorite(token: String, id: String) async {
        do {
            let updated = try await api.toggleFavorite(token: token, id: id)
            if let index = mindmaps.firstIndex(where: { $0.id == id }) {
                mindmaps[index] = updated
            }
        } catch {
            self.error = error.localizedDescription
            showError = true
        }
    }
    
    func duplicateMindmap(token: String, id: String) async {
        do {
            let duplicated = try await api.duplicateMindmap(token: token, id: id)
            mindmaps.insert(duplicated, at: 0)
        } catch {
            self.error = error.localizedDescription
            showError = true
        }
    }
}
