import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct AppIconError: Error, CustomStringConvertible {
  let description: String
}

struct RGBColor {
  let red: CGFloat
  let green: CGFloat
  let blue: CGFloat

  func cgColor(alpha: CGFloat = 1) -> CGColor {
    CGColor(
      red: red,
      green: green,
      blue: blue,
      alpha: alpha
    )
  }
}

struct RGBAColor {
  let red: CGFloat
  let green: CGFloat
  let blue: CGFloat
  let alpha: CGFloat

  init(_ color: RGBColor, alpha: CGFloat = 1) {
    red = color.red
    green = color.green
    blue = color.blue
    self.alpha = alpha
  }

  func cgColor() -> CGColor {
    CGColor(red: red, green: green, blue: blue, alpha: alpha)
  }
}

struct GradientStop {
  let location: CGFloat
  let color: RGBAColor
}

enum FillMode: String {
  case tight
  case balanced
  case framed

  var defaultPaddingRatio: CGFloat {
    switch self {
    case .tight:
      return 0.04
    case .balanced:
      return 0.08
    case .framed:
      return 0.12
    }
  }

  var trimAlphaThreshold: UInt8 {
    switch self {
    case .tight:
      return 32
    case .balanced:
      return 18
    case .framed:
      return 10
    }
  }

  var trimMarginRatio: CGFloat {
    switch self {
    case .tight:
      return 0.018
    case .balanced:
      return 0.028
    case .framed:
      return 0.04
    }
  }
}

struct IconTheme {
  let name: String
  let linearStops: [GradientStop]
  let glowStops: [GradientStop]
  let vignetteStops: [GradientStop]
  let rayColor: RGBAColor
  let haloStrokeColor: RGBAColor
  let glowCenter: CGPoint
}

struct AppIconOptions {
  let theme: IconTheme?
  let backgroundColor: RGBColor
  let canvasSize: Int
  let fillMode: FillMode
  let paddingRatio: CGFloat
  let focusX: CGFloat
  let focusY: CGFloat
}

func fail(_ message: String) throws -> Never {
  throw AppIconError(description: message)
}

func parseHexColor(_ value: String) throws -> RGBColor {
  let trimmedValue = value.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
  guard trimmedValue.count == 6, let hex = Int(trimmedValue, radix: 16) else {
    try fail("Invalid background color '\(value)'. Use a 6-digit hex value like FFFFFF.")
  }

  return RGBColor(
    red: CGFloat((hex >> 16) & 0xFF) / 255,
    green: CGFloat((hex >> 8) & 0xFF) / 255,
    blue: CGFloat(hex & 0xFF) / 255
  )
}

func theme(named name: String) throws -> IconTheme {
  switch name.lowercased() {
  case "sunset-warm", "sunset-boulevard":
    let burntOrange = try parseHexColor("E76F51")
    let coral = try parseHexColor("F4A261")
    let warmSand = try parseHexColor("E9C46A")
    let plum = try parseHexColor("5A294A")
    let ember = try parseHexColor("B4474E")

    return IconTheme(
      name: "sunset-warm",
      linearStops: [
        GradientStop(location: 0, color: RGBAColor(warmSand, alpha: 1)),
        GradientStop(location: 0.28, color: RGBAColor(coral, alpha: 1)),
        GradientStop(location: 0.62, color: RGBAColor(burntOrange, alpha: 1)),
        GradientStop(location: 1, color: RGBAColor(plum, alpha: 1)),
      ],
      glowStops: [
        GradientStop(location: 0, color: RGBAColor(warmSand, alpha: 0.92)),
        GradientStop(location: 0.36, color: RGBAColor(coral, alpha: 0.55)),
        GradientStop(location: 1, color: RGBAColor(coral, alpha: 0)),
      ],
      vignetteStops: [
        GradientStop(location: 0, color: RGBAColor(ember, alpha: 0)),
        GradientStop(location: 0.72, color: RGBAColor(plum, alpha: 0.1)),
        GradientStop(location: 1, color: RGBAColor(plum, alpha: 0.6)),
      ],
      rayColor: RGBAColor(warmSand, alpha: 0.16),
      haloStrokeColor: RGBAColor(warmSand, alpha: 0.2),
      glowCenter: CGPoint(x: 0.56, y: 0.4)
    )
  case "midnight-galaxy":
    let deepPurple = try parseHexColor("2B1E3E")
    let cosmicBlue = try parseHexColor("4A4E8F")
    let lavender = try parseHexColor("A490C2")
    let silver = try parseHexColor("E6E6FA")

    return IconTheme(
      name: "midnight-galaxy",
      linearStops: [
        GradientStop(location: 0, color: RGBAColor(deepPurple, alpha: 1)),
        GradientStop(location: 0.5, color: RGBAColor(cosmicBlue, alpha: 1)),
        GradientStop(location: 1, color: RGBAColor(deepPurple, alpha: 1)),
      ],
      glowStops: [
        GradientStop(location: 0, color: RGBAColor(lavender, alpha: 0.72)),
        GradientStop(location: 0.46, color: RGBAColor(lavender, alpha: 0.24)),
        GradientStop(location: 1, color: RGBAColor(lavender, alpha: 0)),
      ],
      vignetteStops: [
        GradientStop(location: 0, color: RGBAColor(deepPurple, alpha: 0)),
        GradientStop(location: 1, color: RGBAColor(deepPurple, alpha: 0.72)),
      ],
      rayColor: RGBAColor(silver, alpha: 0.12),
      haloStrokeColor: RGBAColor(silver, alpha: 0.18),
      glowCenter: CGPoint(x: 0.56, y: 0.4)
    )
  case "modern-minimal", "modern-minimalist":
    let charcoal = try parseHexColor("36454F")
    let slateGray = try parseHexColor("708090")
    let lightGray = try parseHexColor("D3D3D3")
    let white = try parseHexColor("FFFFFF")

    return IconTheme(
      name: "modern-minimal",
      linearStops: [
        GradientStop(location: 0, color: RGBAColor(lightGray, alpha: 1)),
        GradientStop(location: 0.45, color: RGBAColor(white, alpha: 1)),
        GradientStop(location: 1, color: RGBAColor(slateGray, alpha: 1)),
      ],
      glowStops: [
        GradientStop(location: 0, color: RGBAColor(white, alpha: 0.55)),
        GradientStop(location: 0.42, color: RGBAColor(lightGray, alpha: 0.18)),
        GradientStop(location: 1, color: RGBAColor(lightGray, alpha: 0)),
      ],
      vignetteStops: [
        GradientStop(location: 0, color: RGBAColor(charcoal, alpha: 0)),
        GradientStop(location: 1, color: RGBAColor(charcoal, alpha: 0.4)),
      ],
      rayColor: RGBAColor(white, alpha: 0.08),
      haloStrokeColor: RGBAColor(white, alpha: 0.12),
      glowCenter: CGPoint(x: 0.55, y: 0.4)
    )
  default:
    try fail("Unknown theme '\(name)'. Supported themes: sunset-warm, midnight-galaxy, modern-minimal.")
  }
}

func parseOptions(from arguments: ArraySlice<String>) throws -> AppIconOptions {
  var selectedTheme: IconTheme?
  var backgroundColor = try parseHexColor("000000")
  var canvasSize = 1024
  var fillMode = FillMode.balanced
  var paddingRatio: CGFloat?
  var focusX: CGFloat = 0.5
  var focusY: CGFloat = 0.5

  let optionArguments = Array(arguments)
  var index = 0

  while index < optionArguments.count {
    let argument = optionArguments[index]

    switch argument {
    case "--theme":
      index += 1
      guard index < optionArguments.count else {
        try fail("Missing value for --theme")
      }
      selectedTheme = try theme(named: optionArguments[index])
    case let value where value.hasPrefix("--theme="):
      selectedTheme = try theme(named: String(value.dropFirst("--theme=".count)))
    case "--background":
      index += 1
      guard index < optionArguments.count else {
        try fail("Missing value for --background")
      }
      backgroundColor = try parseHexColor(optionArguments[index])
    case let value where value.hasPrefix("--background="):
      backgroundColor = try parseHexColor(String(value.dropFirst("--background=".count)))
    case "--fill":
      index += 1
      guard index < optionArguments.count, let parsedFillMode = FillMode(rawValue: optionArguments[index]) else {
        try fail("Missing or invalid value for --fill. Use tight, balanced, or framed.")
      }
      fillMode = parsedFillMode
    case let value where value.hasPrefix("--fill="):
      guard let parsedFillMode = FillMode(rawValue: String(value.dropFirst("--fill=".count))) else {
        try fail("Invalid value for --fill. Use tight, balanced, or framed.")
      }
      fillMode = parsedFillMode
    case "--size":
      index += 1
      guard index < optionArguments.count, let parsedSize = Int(optionArguments[index]), parsedSize > 0 else {
        try fail("Missing or invalid value for --size")
      }
      canvasSize = parsedSize
    case let value where value.hasPrefix("--size="):
      guard let parsedSize = Int(value.dropFirst("--size=".count)), parsedSize > 0 else {
        try fail("Invalid value for --size")
      }
      canvasSize = parsedSize
    case "--padding":
      index += 1
      guard index < optionArguments.count, let parsedPadding = Double(optionArguments[index]) else {
        try fail("Missing or invalid value for --padding")
      }
      paddingRatio = CGFloat(parsedPadding)
    case let value where value.hasPrefix("--padding="):
      guard let parsedPadding = Double(value.dropFirst("--padding=".count)) else {
        try fail("Invalid value for --padding")
      }
      paddingRatio = CGFloat(parsedPadding)
    case "--focus-x":
      index += 1
      guard index < optionArguments.count, let parsedFocusX = Double(optionArguments[index]) else {
        try fail("Missing or invalid value for --focus-x")
      }
      focusX = CGFloat(parsedFocusX)
    case let value where value.hasPrefix("--focus-x="):
      guard let parsedFocusX = Double(value.dropFirst("--focus-x=".count)) else {
        try fail("Invalid value for --focus-x")
      }
      focusX = CGFloat(parsedFocusX)
    case "--focus-y":
      index += 1
      guard index < optionArguments.count, let parsedFocusY = Double(optionArguments[index]) else {
        try fail("Missing or invalid value for --focus-y")
      }
      focusY = CGFloat(parsedFocusY)
    case let value where value.hasPrefix("--focus-y="):
      guard let parsedFocusY = Double(value.dropFirst("--focus-y=".count)) else {
        try fail("Invalid value for --focus-y")
      }
      focusY = CGFloat(parsedFocusY)
    default:
      try fail("Unknown option '\(argument)'")
    }

    index += 1
  }

  let resolvedPaddingRatio = paddingRatio ?? fillMode.defaultPaddingRatio

  guard resolvedPaddingRatio >= 0, resolvedPaddingRatio < 0.5 else {
    try fail("Padding must be between 0 and 0.5")
  }
  guard (0...1).contains(focusX), (0...1).contains(focusY) else {
    try fail("Focus values must be between 0 and 1")
  }

  return AppIconOptions(
    theme: selectedTheme,
    backgroundColor: backgroundColor,
    canvasSize: canvasSize,
    fillMode: fillMode,
    paddingRatio: resolvedPaddingRatio,
    focusX: focusX,
    focusY: focusY
  )
}

func aspectFitRect(for imageSize: CGSize, in bounds: CGRect, focusX: CGFloat, focusY: CGFloat) -> CGRect {
  let scale = min(bounds.width / imageSize.width, bounds.height / imageSize.height)
  let scaledSize = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
  let availableWidth = max(0, bounds.width - scaledSize.width)
  let availableHeight = max(0, bounds.height - scaledSize.height)
  let origin = CGPoint(
    x: bounds.minX + (availableWidth * focusX),
    y: bounds.minY + (availableHeight * focusY)
  )

  return CGRect(origin: origin, size: scaledSize)
}

func makeGradient(
  colorSpace: CGColorSpace,
  stops: [GradientStop]
) throws -> CGGradient {
  let colors = stops.map { $0.color.cgColor() } as CFArray
  let locations = stops.map(\.location)

  guard let gradient = CGGradient(
    colorsSpace: colorSpace,
    colors: colors,
    locations: locations
  ) else {
    try fail("Failed to create gradient")
  }

  return gradient
}

func drawSunburst(
  in context: CGContext,
  center: CGPoint,
  canvasSize: CGFloat,
  theme: IconTheme
) {
  let rayCount = 18
  let innerRadius = canvasSize * 0.17
  let outerRadius = canvasSize * 0.52
  let rayWidth = canvasSize * 0.013

  context.saveGState()
  context.translateBy(x: center.x, y: center.y)
  context.setBlendMode(.screen)

  for index in 0..<rayCount {
    context.saveGState()
    let angle = (CGFloat(index) / CGFloat(rayCount)) * .pi * 2
    let lengthMultiplier: CGFloat = index.isMultiple(of: 2) ? 1 : 0.8
    context.rotate(by: angle)
    context.setFillColor(theme.rayColor.cgColor())
    context.fill(
      CGRect(
        x: innerRadius,
        y: -rayWidth / 2,
        width: (outerRadius - innerRadius) * lengthMultiplier,
        height: rayWidth
      )
    )
    context.restoreGState()
  }

  context.restoreGState()
}

func drawBackground(
  in context: CGContext,
  colorSpace: CGColorSpace,
  canvasSize: Int,
  theme: IconTheme
) throws {
  let bounds = CGRect(x: 0, y: 0, width: canvasSize, height: canvasSize)
  let linearGradient = try makeGradient(colorSpace: colorSpace, stops: theme.linearStops)
  context.drawLinearGradient(
    linearGradient,
    start: CGPoint(x: bounds.minX, y: bounds.maxY),
    end: CGPoint(x: bounds.maxX, y: bounds.minY),
    options: [.drawsBeforeStartLocation, .drawsAfterEndLocation]
  )

  let glowCenter = CGPoint(
    x: bounds.width * theme.glowCenter.x,
    y: bounds.height * theme.glowCenter.y
  )
  let glowGradient = try makeGradient(colorSpace: colorSpace, stops: theme.glowStops)
  context.saveGState()
  context.setBlendMode(.screen)
  context.drawRadialGradient(
    glowGradient,
    startCenter: glowCenter,
    startRadius: 0,
    endCenter: glowCenter,
    endRadius: bounds.width * 0.54,
    options: [.drawsAfterEndLocation]
  )
  context.restoreGState()

  drawSunburst(
    in: context,
    center: glowCenter,
    canvasSize: bounds.width,
    theme: theme
  )

  context.saveGState()
  context.setBlendMode(.screen)
  context.setStrokeColor(theme.haloStrokeColor.cgColor())
  context.setLineWidth(bounds.width * 0.01)
  context.strokeEllipse(in: CGRect(
    x: bounds.width * 0.16,
    y: bounds.height * 0.14,
    width: bounds.width * 0.72,
    height: bounds.height * 0.72
  ))
  context.restoreGState()

  let vignetteGradient = try makeGradient(colorSpace: colorSpace, stops: theme.vignetteStops)
  let vignetteCenter = CGPoint(x: bounds.width * 0.88, y: bounds.height * 0.15)
  context.saveGState()
  context.setBlendMode(.multiply)
  context.drawRadialGradient(
    vignetteGradient,
    startCenter: vignetteCenter,
    startRadius: 0,
    endCenter: vignetteCenter,
    endRadius: bounds.width * 0.82,
    options: [.drawsAfterEndLocation]
  )
  context.restoreGState()
}

func alphaBounds(for image: CGImage, threshold: UInt8) throws -> CGRect {
  let width = image.width
  let height = image.height
  let colorSpace = CGColorSpaceCreateDeviceRGB()
  let bytesPerRow = width * 4
  let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue

  guard let context = CGContext(
    data: nil,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: bytesPerRow,
    space: colorSpace,
    bitmapInfo: bitmapInfo
  ) else {
    try fail("Failed to inspect image alpha data")
  }

  context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))

  guard let data = context.data else {
    try fail("Failed to access image alpha data")
  }

  let pixels = data.bindMemory(to: UInt8.self, capacity: width * height * 4)
  var minX = width
  var minY = height
  var maxX = -1
  var maxY = -1

  for y in 0..<height {
    for x in 0..<width {
      let pixelIndex = (y * bytesPerRow) + (x * 4)
      let alpha = pixels[pixelIndex + 3]

      if alpha > threshold {
        minX = min(minX, x)
        minY = min(minY, y)
        maxX = max(maxX, x)
        maxY = max(maxY, y)
      }
    }
  }

  guard maxX >= minX, maxY >= minY else {
    return CGRect(x: 0, y: 0, width: width, height: height)
  }

  return CGRect(
    x: minX,
    y: minY,
    width: (maxX - minX) + 1,
    height: (maxY - minY) + 1
  )
}

func croppedImage(from image: CGImage, fillMode: FillMode) throws -> CGImage {
  let detectedBounds = try alphaBounds(for: image, threshold: fillMode.trimAlphaThreshold)
  let margin = CGFloat(max(image.width, image.height)) * fillMode.trimMarginRatio
  let expandedBounds = detectedBounds.insetBy(dx: -margin, dy: -margin)
  let imageBounds = CGRect(x: 0, y: 0, width: image.width, height: image.height)
  let cropRect = expandedBounds.intersection(imageBounds).integral

  guard let croppedImage = image.cropping(to: cropRect) else {
    try fail("Failed to crop icon artwork")
  }

  return croppedImage
}

func main() throws {
  let args = CommandLine.arguments
  guard args.count >= 3 else {
    try fail(
      "Usage: swift scripts/generate-app-icon.swift <input.png> <output.png> " +
      "[--theme sunset-warm] [--background FFFFFF] [--fill tight] " +
      "[--size 1024] [--padding 0.04] [--focus-x 0.5] [--focus-y 0.5]"
    )
  }

  let inputURL = URL(fileURLWithPath: args[1])
  let outputURL = URL(fileURLWithPath: args[2])
  let options = try parseOptions(from: args.dropFirst(3))

  guard let imageSource = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
        let sourceImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
    try fail("Could not read input image at \(inputURL.path)")
  }

  let croppedSourceImage = try croppedImage(from: sourceImage, fillMode: options.fillMode)
  let width = options.canvasSize
  let height = options.canvasSize
  let colorSpace = CGColorSpaceCreateDeviceRGB()
  let bitmapInfo = CGImageAlphaInfo.noneSkipLast.rawValue

  guard let context = CGContext(
    data: nil,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: 0,
    space: colorSpace,
    bitmapInfo: bitmapInfo
  ) else {
    try fail("Failed to create graphics context")
  }

  if let selectedTheme = options.theme {
    try drawBackground(
      in: context,
      colorSpace: colorSpace,
      canvasSize: width,
      theme: selectedTheme
    )
  } else {
    context.setFillColor(options.backgroundColor.cgColor())
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
  }

  context.interpolationQuality = .high
  let inset = CGFloat(width) * options.paddingRatio
  let targetBounds = CGRect(
    x: inset,
    y: inset,
    width: CGFloat(width) - (inset * 2),
    height: CGFloat(height) - (inset * 2)
  )
  let targetRect = aspectFitRect(
    for: CGSize(width: croppedSourceImage.width, height: croppedSourceImage.height),
    in: targetBounds,
    focusX: options.focusX,
    focusY: options.focusY
  )
  context.saveGState()
  context.setShadow(
    offset: CGSize(width: 0, height: -CGFloat(height) * 0.01),
    blur: CGFloat(width) * 0.03,
    color: (options.theme?.linearStops.last?.color ?? RGBAColor(options.backgroundColor, alpha: 0.28)).cgColor()
  )
  context.draw(croppedSourceImage, in: targetRect)
  context.restoreGState()

  guard let composedImage = context.makeImage() else {
    try fail("Failed to render composed image")
  }

  let outputDirectory = outputURL.deletingLastPathComponent()
  try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

  guard let destination = CGImageDestinationCreateWithURL(
    outputURL as CFURL,
    UTType.png.identifier as CFString,
    1,
    nil
  ) else {
    try fail("Failed to create PNG destination")
  }

  CGImageDestinationAddImage(destination, composedImage, nil)
  guard CGImageDestinationFinalize(destination) else {
    try fail("Failed to write PNG output")
  }

  print("Generated icon: \(outputURL.path)")
}

do {
  try main()
} catch {
  fputs("error: \(error)\n", stderr)
  exit(1)
}
