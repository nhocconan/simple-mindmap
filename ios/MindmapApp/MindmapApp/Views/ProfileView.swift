import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationStack {
            List {
                // User info section
                if let user = authViewModel.user {
                    Section {
                        HStack(spacing: 16) {
                            Text(user.initials)
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .frame(width: 60, height: 60)
                                .background(Color.blue)
                                .clipShape(Circle())
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(user.displayName)
                                    .font(.headline)
                                Text(user.email)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 8)
                    }
                    
                    Section {
                        HStack {
                            Text("Role")
                            Spacer()
                            Text(user.role.capitalized)
                                .foregroundColor(.secondary)
                        }
                        
                        HStack {
                            Text("Verified")
                            Spacer()
                            Image(systemName: user.isVerified ? "checkmark.circle.fill" : "xmark.circle")
                                .foregroundColor(user.isVerified ? .green : .red)
                        }
                    } header: {
                        Text("Account Info")
                    }
                }
                
                // App info
                Section {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                } header: {
                    Text("App Info")
                }
                
                // Logout
                Section {
                    Button(role: .destructive) {
                        authViewModel.logout()
                        dismiss()
                    } label: {
                        HStack {
                            Spacer()
                            Text("Sign Out")
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthViewModel())
}
