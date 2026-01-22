import Foundation
import Capacitor
import GoogleSignIn

@objc(GoogleAuth)
public class GoogleAuth: CAPPlugin {
    var signInCall: CAPPluginCall!
    var googleSignIn: GIDSignIn?
    var googleSignInConfiguration: GIDConfiguration?
    var forceAuthCode: Bool = false
    var additionalScopes: [String] = []

    func ensureInitialized() {
        if googleSignIn != nil && googleSignInConfiguration != nil {
            return
        }
        
        // V6: Robust Client ID Loading
        // 1. Try Config
        var clientId = getClientIdValue()
        
        // 2. Try Manual Plist Search (Backup)
        if clientId == nil {
             if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
               let dict = NSDictionary(contentsOfFile: path) as? [String: AnyObject] {
                clientId = dict["CLIENT_ID"] as? String
            }
        }
        
        let validClientId = clientId ?? ""
        
        let configScopes = getConfig().getArray("scopes") as? [String] ?? []
        self.loadSignInClient(customClientId: validClientId, customScopes: configScopes)
    }

    func loadSignInClient(customClientId: String, customScopes: [String]) {
        if customClientId.isEmpty {
            // V6: Prevent Crash - Do not init config if ID is empty
            print("GoogleAuth Error: No Client ID found. Sign-In will fail.")
            return
        }
        
        googleSignIn = GIDSignIn.sharedInstance
        let serverClientId = getServerClientIdValue()

        // V6: Wrap in Try-Catch equivalent (if possible) or just init safely
        // GIDConfiguration throws objc exception if clientID is empty, so we guarded above.
        googleSignInConfiguration = GIDConfiguration(clientID: customClientId, serverClientID: serverClientId)
        
        if let googleSignIn = googleSignIn, let config = googleSignInConfiguration {
            googleSignIn.configuration = config
        }
        
        let defaultGrantedScopes = ["email", "profile", "openid"]
        additionalScopes = customScopes.filter { !defaultGrantedScopes.contains($0) }

        let configForce = getConfig().getBoolean("forceCodeForRefreshToken", false)
        forceAuthCode = configForce
        
        NotificationCenter.default.addObserver(self, selector: #selector(handleOpenUrl(_:)), name: Notification.Name("capacitorOpenURL"), object: nil)
    }
    
    public override func load() {}

    @objc
    func initialize(_ call: CAPPluginCall) {
        let clientId1 = call.getString("clientId")
        let clientId2 = getClientIdValue()
        
        guard let clientId = clientId1 ?? clientId2 else {
            NSLog("no client id found in config")
            call.resolve()
            return
        }

        let configScopes = getConfig().getArray("scopes") as? [String] ?? []
        let customScopes = call.getArray("scopes", String.self) ?? configScopes

        let configForce = getConfig().getBoolean("forceCodeForRefreshToken", false)
        forceAuthCode = call.getBool("grantOfflineAccess") ?? configForce
        
        self.loadSignInClient(customClientId: clientId, customScopes: customScopes)
        call.resolve()
    }

    @objc
    func signIn(_ call: CAPPluginCall) {
        self.signInCall = call
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            self.ensureInitialized()
            
            // V6: Graceful Failure
            guard let googleSignIn = self.googleSignIn, let _ = self.googleSignInConfiguration else {
                let msg = "Google Sign-In not initialized. Check GoogleService-Info.plist."
                print(msg)
                self.signInCall?.reject(msg)
                return
            }

            if googleSignIn.hasPreviousSignIn() && !self.forceAuthCode {
                googleSignIn.restorePreviousSignIn { user, error in
                    if let error = error {
                        self.signInCall?.reject(error.localizedDescription)
                        return
                    }
                    guard let user = user else {
                        self.signInCall?.reject("No user restored")
                        return
                    }
                    self.resolveSignInCallWith(user: user, serverAuthCode: nil)
                }
            } else {
                guard let bridge = self.bridge, let presentingVc = bridge.viewController else {
                    self.signInCall?.reject("No presenting view controller")
                    return
                }
                
                googleSignIn.signIn(withPresenting: presentingVc, hint: nil, additionalScopes: self.additionalScopes) { result, error in
                    if let error = error {
                        let nsError = error as NSError
                        self.signInCall?.reject(error.localizedDescription, "\(nsError.code)")
                        return
                    }
                    guard let result = result else {
                        self.signInCall?.reject("No sign-in result")
                        return
                    }
                    self.resolveSignInCallWith(user: result.user, serverAuthCode: result.serverAuthCode)
                }
            }
        }
    }

    @objc
    func refresh(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.ensureInitialized()
            
            guard let googleSignIn = self.googleSignIn, let currentUser = googleSignIn.currentUser else {
                call.reject("User not logged in.")
                return
            }
            
            currentUser.refreshTokensIfNeeded { user, error in
                guard let user = user, error == nil else {
                    call.reject(error?.localizedDescription ?? "Something went wrong.")
                    return
                }
                
                let authenticationData: [String: Any] = [
                    "accessToken": user.accessToken.tokenString,
                    "idToken": user.idToken?.tokenString ?? NSNull(),
                    "refreshToken": user.refreshToken.tokenString
                ]
                call.resolve(authenticationData)
            }
        }
    }

    @objc
    func signOut(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
             self.ensureInitialized()
             self.googleSignIn?.signOut()
        }
        call.resolve()
    }

    @objc
    func handleOpenUrl(_ notification: Notification) {
        guard let object = notification.object as? [String: Any],
              let url = object["url"] as? URL else {
            return
        }
        GIDSignIn.sharedInstance.handle(url)
    }
    
    func getClientIdValue() -> String? {
        if let clientId = getConfig().getString("iosClientId") {
            return clientId
        }
        if let clientId = getConfig().getString("clientId") {
            return clientId
        }
        if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
           let dict = NSDictionary(contentsOfFile: path) as? [String: AnyObject],
           let clientId = dict["CLIENT_ID"] as? String {
            return clientId
        }
        return nil
    }
    
    func getServerClientIdValue() -> String? {
        return getConfig().getString("serverClientId")
    }

    func resolveSignInCallWith(user: GIDGoogleUser, serverAuthCode: String?) {
        var userData: [String: Any] = [
            "authentication": [
                "accessToken": user.accessToken.tokenString,
                "idToken": user.idToken?.tokenString ?? NSNull(),
                "refreshToken": user.refreshToken.tokenString
            ] as [String: Any],
            "serverAuthCode": serverAuthCode ?? NSNull(),
            "email": user.profile?.email ?? NSNull(),
            "familyName": user.profile?.familyName ?? NSNull(),
            "givenName": user.profile?.givenName ?? NSNull(),
            "id": user.userID ?? NSNull(),
            "name": user.profile?.name ?? NSNull()
        ]
        
        if let imageUrl = user.profile?.imageURL(withDimension: 100)?.absoluteString {
            userData["imageUrl"] = imageUrl
        }
        
        signInCall?.resolve(userData)
    }
}
