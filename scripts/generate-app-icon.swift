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
}

struct AppIconOptions {
  let backgroundColor: RGBColor
  let canvasSize: Int
  let paddingRatio: CGFloat
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

func parseOptions(from arguments: ArraySlice<String>) throws -> AppIconOptions {
  var backgroundColor = try parseHexColor("000000")
  var canvasSize = 1024
  var paddingRatio: CGFloat = 0

  let optionArguments = Array(arguments)
  var index = 0

  while index < optionArguments.count {
    let argument = optionArguments[index]

    switch argument {
    case "--background":
      index += 1
      guard index < optionArguments.count else {
        try fail("Missing value for --background")
      }
      backgroundColor = try parseHexColor(optionArguments[index])
    case let value where value.hasPrefix("--background="):
      backgroundColor = try parseHexColor(String(value.dropFirst("--background=".count)))
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
    default:
      try fail("Unknown option '\(argument)'")
    }

    index += 1
  }

  guard paddingRatio >= 0, paddingRatio < 0.5 else {
    try fail("Padding must be between 0 and 0.5")
  }

  return AppIconOptions(
    backgroundColor: backgroundColor,
    canvasSize: canvasSize,
    paddingRatio: paddingRatio
  )
}

func aspectFitRect(for imageSize: CGSize, in bounds: CGRect) -> CGRect {
  let scale = min(bounds.width / imageSize.width, bounds.height / imageSize.height)
  let scaledSize = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
  let origin = CGPoint(
    x: bounds.midX - scaledSize.width / 2,
    y: bounds.midY - scaledSize.height / 2
  )

  return CGRect(origin: origin, size: scaledSize)
}

func main() throws {
  let args = CommandLine.arguments
  guard args.count >= 3 else {
    try fail(
      "Usage: swift scripts/generate-app-icon.swift <input.png> <output.png> " +
      "[--background FFFFFF] [--size 1024] [--padding 0.12]"
    )
  }

  let inputURL = URL(fileURLWithPath: args[1])
  let outputURL = URL(fileURLWithPath: args[2])
  let options = try parseOptions(from: args.dropFirst(3))

  guard let imageSource = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
        let sourceImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
    try fail("Could not read input image at \(inputURL.path)")
  }
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

  context.setFillColor(
    red: options.backgroundColor.red,
    green: options.backgroundColor.green,
    blue: options.backgroundColor.blue,
    alpha: 1
  )
  context.fill(CGRect(x: 0, y: 0, width: width, height: height))

  context.interpolationQuality = .high
  let inset = CGFloat(width) * options.paddingRatio
  let targetBounds = CGRect(
    x: inset,
    y: inset,
    width: CGFloat(width) - (inset * 2),
    height: CGFloat(height) - (inset * 2)
  )
  let targetRect = aspectFitRect(
    for: CGSize(width: sourceImage.width, height: sourceImage.height),
    in: targetBounds
  )
  context.draw(sourceImage, in: targetRect)

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
