// Renders pages of a PDF to JPEG (and OCR text with Vision, Latin not supported so text is only a finding aid).
// Usage: page <in.pdf> <outdir> <scale> <page>...   -> outdir/p0001.jpg, p0001.txt ; "count" as page prints the page count
import Foundation
import PDFKit
import Vision
import AppKit
let a = CommandLine.arguments
guard a.count >= 5, let doc = PDFDocument(url: URL(fileURLWithPath: a[1])) else { print("usage"); exit(1) }
try? FileManager.default.createDirectory(atPath: a[2], withIntermediateDirectories: true)
let scale = CGFloat(Double(a[3]) ?? 2.0)
for s in a[4...] {
  if s == "count" { print(doc.pageCount); continue }
  guard let i = Int(s), let page = doc.page(at: i - 1) else { continue }
  let b = page.bounds(for: .mediaBox)
  let img = page.thumbnail(of: NSSize(width: b.width * scale, height: b.height * scale), for: .mediaBox)
  guard let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let rep = NSBitmapImageRep(cgImage: cg)
  let jpg = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.8])!
  try? jpg.write(to: URL(fileURLWithPath: String(format: "%@/p%04d.jpg", a[2], i)))
  let req = VNRecognizeTextRequest(); req.recognitionLevel = .accurate; req.usesLanguageCorrection = false
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  var lines: [(CGFloat, CGFloat, String)] = []
  for o in (req.results ?? []) { if let t = o.topCandidates(1).first { lines.append((o.boundingBox.midY, o.boundingBox.minX, t.string)) } }
  let col = { (x: CGFloat) -> Int in x < 0.47 ? 0 : 1 }
  let out = lines.sorted { col($0.1) != col($1.1) ? col($0.1) < col($1.1) : $0.0 > $1.0 }.map { $0.2 }
  try? out.joined(separator: "\n").write(toFile: String(format: "%@/p%04d.txt", a[2], i), atomically: true, encoding: .utf8)
  print("p\(i) \(Int(b.width))x\(Int(b.height))")
}
