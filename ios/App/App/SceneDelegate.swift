import UIKit
import Capacitor
import CoreMotion

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

class AppBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(MotionTiltPlugin())
    }
}

@objc(MotionTiltPlugin)
class MotionTiltPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "MotionTiltPlugin"
    let jsName = "MotionTilt"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]

    private let motionManager = CMMotionManager()
    private let motionQueue: OperationQueue = {
        let queue = OperationQueue()
        queue.name = "com.fitwizardly.motion-tilt"
        queue.qualityOfService = .userInteractive
        queue.maxConcurrentOperationCount = 1
        return queue
    }()

    private let updateInterval = 1.0 / 60.0

    @objc func getStatus(_ call: CAPPluginCall) {
        call.resolve(makeStatusPayload())
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        let permission = motionManager.isDeviceMotionAvailable ? "granted" : "denied"
        call.resolve([
            "permission": permission
        ])
    }

    @objc func start(_ call: CAPPluginCall) {
        guard motionManager.isDeviceMotionAvailable else {
            call.reject("Device motion is unavailable on this device.")
            return
        }

        if motionManager.isDeviceMotionActive {
            call.resolve()
            return
        }

        motionManager.deviceMotionUpdateInterval = updateInterval
        let referenceFrame: CMAttitudeReferenceFrame = CMMotionManager.availableAttitudeReferenceFrames().contains(.xArbitraryCorrectedZVertical)
            ? .xArbitraryCorrectedZVertical
            : .xArbitraryZVertical

        motionManager.startDeviceMotionUpdates(using: referenceFrame, to: motionQueue) { [weak self] motion, _ in
            guard let self, let motion else {
                return
            }

            let pitch = motion.attitude.pitch * 180 / .pi
            let roll = motion.attitude.roll * 180 / .pi

            DispatchQueue.main.async {
                self.notifyListeners("tilt", data: [
                    "pitch": pitch,
                    "roll": roll,
                    "timestamp": Int(Date().timeIntervalSince1970 * 1000)
                ])
            }
        }

        call.resolve()
    }

    @objc func stop(_ call: CAPPluginCall) {
        motionManager.stopDeviceMotionUpdates()
        call.resolve()
    }

    private func makeStatusPayload() -> [String: Any] {
        [
            "available": motionManager.isDeviceMotionAvailable,
            "permission": motionManager.isDeviceMotionAvailable ? "granted" : "denied",
            "source": "native"
        ]
    }
}
