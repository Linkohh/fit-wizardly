import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct AppIconError: Error, CustomStringConvertible {
  let description: String
}

func fail(_ message: String) throws -> Never {
  throw AppIconError(description: message)
}

func main() throws {
  let args = CommandLine.arguments
  guard args.count == 3 else {
    try fail("Usage: swift scripts/generate-app-icon.swift <input.png> <output.png>")
  }

  let inputURL = URL(fileURLWithPath: args[1])
  let outputURL = URL(fileURLWithPath: args[2])

  guard let imageSource = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
        let sourceImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
    try fail("Could not read input image at \(inputURL.path)")
  }
  let width = 1024
  let height = 1024
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

  context.setFillColor(red: 0, green: 0, blue: 0, alpha: 1)
  context.fill(CGRect(x: 0, y: 0, width: width, height: height))

  context.interpolationQuality = .high
  context.draw(sourceImage, in: CGRect(x: 0, y: 0, width: width, height: height))

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
