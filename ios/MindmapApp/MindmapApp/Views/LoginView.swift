import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var showRegister = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()
                
                // Logo and title
                VStack(spacing: 12) {
                    Image(systemName: "brain.head.profile")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 80, height: 80)
                        .foregroundStyle(.blue.gradient)
                    
                    Text("Mindmap")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Organize your thoughts visually")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Login form
                VStack(spacing: 16) {
                    TextField("Email", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.password)
                    
                    Button {
                        Task {
                            await authViewModel.login(email: email, password: password)
                        }
                    } label: {
                        HStack {
                            if authViewModel.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            }
                            Text("Sign In")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .disabled(email.isEmpty || password.isEmpty || authViewModel.isLoading)
                }
                .padding(.horizontal)
                
                // Register link
                Button {
                    showRegister = true
                } label: {
                    HStack {
                        Text("Don't have an account?")
                            .foregroundColor(.secondary)
                        Text("Sign Up")
                            .fontWeight(.semibold)
                    }
                }
                
                Spacer()
            }
            .padding()
            .navigationDestination(isPresented: $showRegister) {
                RegisterView()
            }
            .alert("Error", isPresented: $authViewModel.showError) {
                Button("OK") {}
            } message: {
                Text(authViewModel.error ?? "An error occurred")
            }
        }
    }
}

struct RegisterView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) var dismiss
    
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var passwordError: String?
    
    var isFormValid: Bool {
        !email.isEmpty && 
        !password.isEmpty && 
        password == confirmPassword &&
        password.count >= 8
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "person.badge.plus")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 60, height: 60)
                        .foregroundStyle(.blue.gradient)
                    
                    Text("Create Account")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("Join Mindmap today")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 20)
                
                // Form
                VStack(spacing: 16) {
                    HStack(spacing: 12) {
                        TextField("First Name", text: $firstName)
                            .textFieldStyle(.roundedBorder)
                            .textContentType(.givenName)
                        
                        TextField("Last Name", text: $lastName)
                            .textFieldStyle(.roundedBorder)
                            .textContentType(.familyName)
                    }
                    
                    TextField("Email", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.newPassword)
                        .onChange(of: password) { _, newValue in
                            validatePassword()
                        }
                    
                    SecureField("Confirm Password", text: $confirmPassword)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.newPassword)
                        .onChange(of: confirmPassword) { _, newValue in
                            validatePassword()
                        }
                    
                    if let error = passwordError {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                    
                    Button {
                        Task {
                            await authViewModel.register(
                                email: email,
                                password: password,
                                firstName: firstName.isEmpty ? nil : firstName,
                                lastName: lastName.isEmpty ? nil : lastName
                            )
                        }
                    } label: {
                        HStack {
                            if authViewModel.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            }
                            Text("Create Account")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(isFormValid ? Color.blue : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .disabled(!isFormValid || authViewModel.isLoading)
                }
                .padding(.horizontal)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .alert("Error", isPresented: $authViewModel.showError) {
            Button("OK") {}
        } message: {
            Text(authViewModel.error ?? "An error occurred")
        }
    }
    
    private func validatePassword() {
        if password.count < 8 {
            passwordError = "Password must be at least 8 characters"
        } else if !confirmPassword.isEmpty && password != confirmPassword {
            passwordError = "Passwords do not match"
        } else {
            passwordError = nil
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthViewModel())
}
