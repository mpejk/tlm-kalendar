// OCR of a PDF with the macOS Vision framework (stands in for tesseract, which is not installed).
// Usage: swift ocr-pdf.swift in.pdf outdir [firstPage lastPage] [lang ...]   -> outdir/p0001.txt ...
import Foundation
import PDFKit
import Vision
import AppKit

let args = CommandLine.arguments
guard args.count >= 3, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else { print("usage"); exit(1) }
let outDir = args[2]
try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)
let first = args.count > 3 ? Int(args[3])! : 1
let last = args.count > 4 ? min(Int(args[4])!, doc.pageCount) : doc.pageCount
let langs = args.count > 5 ? Array(args[5...]) : ["en-US"]
for i in first...last {
  let outPath = String(format: "%@/p%04d.txt", outDir, i)
  if FileManager.default.fileExists(atPath: outPath) { continue }
  guard let page = doc.page(at: i - 1) else { continue }
  let bounds = page.bounds(for: .mediaBox)
  let scale: CGFloat = 3.0
  let size = NSSize(width: bounds.width * scale, height: bounds.height * scale)
  let img = page.thumbnail(of: size, for: .mediaBox)
  guard let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let req = VNRecognizeTextRequest()
  req.recognitionLevel = .accurate
  req.usesLanguageCorrection = true
  req.recognitionLanguages = langs
  let handler = VNImageRequestHandler(cgImage: cg, options: [:])
  try? handler.perform([req])
  var lines: [(CGFloat, CGFloat, String)] = []
  for obs in (req.results ?? []) {
    if let t = obs.topCandidates(1).first { lines.append((obs.boundingBox.midY, obs.boundingBox.minX, t.string)) }
  }
  // reading order: top to bottom, then left to right
  // reading order: a landscape sheet holds two book pages, so left half first, then right half; top to bottom within each
  let twoUp = bounds.width > bounds.height
  func ordered(_ a: [(CGFloat, CGFloat, String)]) -> [String] { a.sorted { abs($0.0 - $1.0) > 0.006 ? $0.0 > $1.0 : $0.1 < $1.1 }.map { $0.2 } }
  var out: [String]
  if twoUp { out = ordered(lines.filter { $0.1 < 0.49 }) + ["", "-----"] + ordered(lines.filter { $0.1 >= 0.49 }) } else { out = ordered(lines) }
  try? out.joined(separator: "\n").write(toFile: outPath, atomically: true, encoding: .utf8)
}
print("done \(first)-\(last)")
