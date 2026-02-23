import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        hideWebViewScrollIndicators()
        configureForDevelopmentTools()
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        hideWebViewScrollIndicators()
        configureForDevelopmentTools()
    }

    private func hideWebViewScrollIndicators() {
        DispatchQueue.main.async { [weak self] in
            guard
                let bridgeViewController = self?.window?.rootViewController as? CAPBridgeViewController,
                let scrollView = bridgeViewController.webView?.scrollView
            else {
                return
            }

            scrollView.showsVerticalScrollIndicator = false
            scrollView.showsHorizontalScrollIndicator = false
        }
    }

    private func configureForDevelopmentTools() {
        // Enable Safari Web Inspector on iOS 16.4+ and log the current URL to help verify live reload
        guard let bridgeViewController = self.window?.rootViewController as? CAPBridgeViewController else { return }

        if #available(iOS 16.4, *) {
            bridgeViewController.webView?.isInspectable = true
        }

        // Log the URL after a short delay so the web view has a chance to start loading
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak bridgeViewController] in
            if let current = bridgeViewController?.webView?.url?.absoluteString, !current.isEmpty {
                print("Capacitor WKWebView URL: \(current)")
            } else {
                print("Capacitor WKWebView URL not yet available. If using live reload, ensure your dev server is running and 'server.url' is set in capacitor.config.")
            }
        }
    }
}
