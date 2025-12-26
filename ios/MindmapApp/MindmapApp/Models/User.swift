import Foundation

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let firstName: String?
    let lastName: String?
    let avatar: String?
    let role: String
    let isActive: Bool
    let isVerified: Bool
    let createdAt: String?
    let updatedAt: String?
    
    var displayName: String {
        if let first = firstName, let last = lastName {
            return "\(first) \(last)"
        } else if let first = firstName {
            return first
        } else {
            return email
        }
    }
    
    var initials: String {
        if let first = firstName?.first, let last = lastName?.first {
            return "\(first)\(last)".uppercased()
        } else if let first = firstName?.first {
            return String(first).uppercased()
        } else {
            return String(email.prefix(2)).uppercased()
        }
    }
}

struct AuthResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int
}

struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct RegisterRequest: Codable {
    let email: String
    let password: String
    let firstName: String?
    let lastName: String?
}
