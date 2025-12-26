import Foundation
import SwiftUI

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var user: User?
    @Published var error: String?
    @Published var showError = false
    
    private let api = APIService.shared
    private let tokenKey = "accessToken"
    private let refreshTokenKey = "refreshToken"
    
    var accessToken: String? {
        get { UserDefaults.standard.string(forKey: tokenKey) }
        set {
            if let value = newValue {
                UserDefaults.standard.set(value, forKey: tokenKey)
            } else {
                UserDefaults.standard.removeObject(forKey: tokenKey)
            }
        }
    }
    
    var refreshToken: String? {
        get { UserDefaults.standard.string(forKey: refreshTokenKey) }
        set {
            if let value = newValue {
                UserDefaults.standard.set(value, forKey: refreshTokenKey)
            } else {
                UserDefaults.standard.removeObject(forKey: refreshTokenKey)
            }
        }
    }
    
    init() {
        Task {
            await checkAuth()
        }
    }
    
    func checkAuth() async {
        guard let token = accessToken else {
            isAuthenticated = false
            return
        }
        
        isLoading = true
        do {
            user = try await api.getMe(token: token)
            isAuthenticated = true
        } catch APIError.unauthorized {
            // Try to refresh token
            if let refresh = refreshToken {
                do {
                    let response = try await api.refreshToken(refresh)
                    accessToken = response.accessToken
                    self.refreshToken = response.refreshToken
                    user = try await api.getMe(token: response.accessToken)
                    isAuthenticated = true
                } catch {
                    logout()
                }
            } else {
                logout()
            }
        } catch {
            logout()
        }
        isLoading = false
    }
    
    func login(email: String, password: String) async {
        isLoading = true
        error = nil
        
        do {
            let response = try await api.login(email: email, password: password)
            accessToken = response.accessToken
            refreshToken = response.refreshToken
            user = try await api.getMe(token: response.accessToken)
            isAuthenticated = true
        } catch {
            self.error = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func register(email: String, password: String, firstName: String?, lastName: String?) async {
        isLoading = true
        error = nil
        
        do {
            let response = try await api.register(email: email, password: password, firstName: firstName, lastName: lastName)
            accessToken = response.accessToken
            refreshToken = response.refreshToken
            user = try await api.getMe(token: response.accessToken)
            isAuthenticated = true
        } catch {
            self.error = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func logout() {
        if let token = accessToken {
            Task {
                try? await api.logout(token: token)
            }
        }
        accessToken = nil
        refreshToken = nil
        user = nil
        isAuthenticated = false
    }
}
