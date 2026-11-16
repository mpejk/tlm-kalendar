// Crops a region of an image: crop <in.jpg> <out.jpg> <x> <y> <w> <h>   (pixels, origin top-left)
import Foundation
import AppKit
let a = CommandLine.arguments
guard a.count == 7, let img = NSImage(contentsOfFile: a[1]), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { print("usage"); exit(1) }
let r = CGRect(x: Int(a[3])!, y: Int(a[4])!, width: Int(a[5])!, height: Int(a[6])!)
guard let c = cg.cropping(to: r) else { exit(1) }
let rep = NSBitmapImageRep(cgImage: c)
try! rep.representation(using: .jpeg, properties: [.compressionFactor: 0.8])!.write(to: URL(fileURLWithPath: a[2]))
