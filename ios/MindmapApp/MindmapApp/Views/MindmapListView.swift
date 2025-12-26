import SwiftUI

struct MindmapListView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = MindmapListViewModel()
    @State private var showNewMindmapSheet = false
    @State private var newMindmapTitle = ""
    @State private var selectedMindmap: Mindmap?
    @State private var showProfile = false
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.mindmaps.isEmpty {
                    ProgressView("Loading mindmaps...")
                } else if viewModel.mindmaps.isEmpty {
                    emptyState
                } else {
                    mindmapList
                }
            }
            .navigationTitle("My Mindmaps")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        showProfile = true
                    } label: {
                        if let user = authViewModel.user {
                            Text(user.initials)
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                                .frame(width: 32, height: 32)
                                .background(Color.blue)
                                .clipShape(Circle())
                        } else {
                            Image(systemName: "person.circle")
                        }
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showNewMindmapSheet = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .searchable(text: $viewModel.searchText, prompt: "Search mindmaps")
            .onChange(of: viewModel.searchText) { _, _ in
                Task {
                    if let token = authViewModel.accessToken {
                        await viewModel.loadMindmaps(token: token)
                    }
                }
            }
            .refreshable {
                if let token = authViewModel.accessToken {
                    await viewModel.refresh(token: token)
                }
            }
            .sheet(isPresented: $showNewMindmapSheet) {
                createMindmapSheet
            }
            .sheet(isPresented: $showProfile) {
                ProfileView()
            }
            .navigationDestination(item: $selectedMindmap) { mindmap in
                MindmapEditorView(mindmapId: mindmap.id)
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK") {}
            } message: {
                Text(viewModel.error ?? "An error occurred")
            }
        }
        .task {
            if let token = authViewModel.accessToken {
                await viewModel.loadMindmaps(token: token)
            }
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "brain.head.profile")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 80, height: 80)
                .foregroundColor(.gray)
            
            Text("No Mindmaps Yet")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Create your first mindmap to get started")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Button {
                showNewMindmapSheet = true
            } label: {
                Label("Create Mindmap", systemImage: "plus")
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .padding()
    }
    
    private var mindmapList: some View {
        List {
            // Filter toggles
            Section {
                Toggle("Favorites Only", isOn: $viewModel.showFavoritesOnly)
                    .onChange(of: viewModel.showFavoritesOnly) { _, _ in
                        Task {
                            if let token = authViewModel.accessToken {
                                await viewModel.loadMindmaps(token: token)
                            }
                        }
                    }
            }
            
            // Mindmaps
            Section {
                ForEach(viewModel.mindmaps) { mindmap in
                    MindmapRowView(mindmap: mindmap)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            selectedMindmap = mindmap
                        }
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                Task {
                                    if let token = authViewModel.accessToken {
                                        await viewModel.deleteMindmap(token: token, id: mindmap.id)
                                    }
                                }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                            
                            Button {
                                Task {
                                    if let token = authViewModel.accessToken {
                                        await viewModel.duplicateMindmap(token: token, id: mindmap.id)
                                    }
                                }
                            } label: {
                                Label("Duplicate", systemImage: "doc.on.doc")
                            }
                            .tint(.orange)
                        }
                        .swipeActions(edge: .leading) {
                            Button {
                                Task {
                                    if let token = authViewModel.accessToken {
                                        await viewModel.toggleFavorite(token: token, id: mindmap.id)
                                    }
                                }
                            } label: {
                                Label(
                                    mindmap.isFavorite ? "Unfavorite" : "Favorite",
                                    systemImage: mindmap.isFavorite ? "star.slash" : "star"
                                )
                            }
                            .tint(.yellow)
                        }
                }
            }
        }
    }
    
    private var createMindmapSheet: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Title", text: $newMindmapTitle)
                } header: {
                    Text("Mindmap Details")
                }
            }
            .navigationTitle("New Mindmap")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        showNewMindmapSheet = false
                        newMindmapTitle = ""
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        Task {
                            if let token = authViewModel.accessToken {
                                if let mindmap = await viewModel.createMindmap(token: token, title: newMindmapTitle) {
                                    showNewMindmapSheet = false
                                    newMindmapTitle = ""
                                    selectedMindmap = mindmap
                                }
                            }
                        }
                    }
                    .disabled(newMindmapTitle.isEmpty)
                }
            }
        }
        .presentationDetents([.medium])
    }
}

struct MindmapRowView: View {
    let mindmap: Mindmap
    
    var body: some View {
        HStack(spacing: 12) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.blue.opacity(0.1))
                    .frame(width: 44, height: 44)
                
                Image(systemName: "brain.head.profile")
                    .foregroundColor(.blue)
            }
            
            // Details
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(mindmap.title)
                        .font(.headline)
                    
                    if mindmap.isFavorite {
                        Image(systemName: "star.fill")
                            .font(.caption)
                            .foregroundColor(.yellow)
                    }
                }
                
                HStack(spacing: 8) {
                    Image(systemName: mindmap.visibility.icon)
                        .font(.caption2)
                    
                    Text(mindmap.formattedDate)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("•")
                        .foregroundColor(.secondary)
                    
                    Text("\(mindmap.data.nodes.count) nodes")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    MindmapListView()
        .environmentObject(AuthViewModel())
}
