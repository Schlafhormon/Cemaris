param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination
)

$ErrorActionPreference = 'Stop'
$expectedHash = '71CFF8C66F7C7C62F07D3F551F0D1F4D2757FF6A49ED23297B1AD45393CB530F'
$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $Source).Hash
if ($actualHash -ne $expectedHash) {
    throw "Die autorisierte synthetische DOCX-Quelle besitzt nicht den freigegebenen SHA-256-Wert."
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$destinationDirectory = Split-Path -Parent $Destination
[IO.Directory]::CreateDirectory($destinationDirectory) | Out-Null
$sourceArchive = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Source))
$destinationStream = [IO.File]::Open($Destination, [IO.FileMode]::Create, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
try {
    $destinationArchive = [IO.Compression.ZipArchive]::new($destinationStream, [IO.Compression.ZipArchiveMode]::Create, $true)
    try {
        foreach ($entry in $sourceArchive.Entries) {
            $target = $destinationArchive.CreateEntry($entry.FullName, [IO.Compression.CompressionLevel]::Optimal)
            $target.LastWriteTime = $entry.LastWriteTime
            $input = $entry.Open()
            $output = $target.Open()
            try {
                if ($entry.FullName -eq 'word/document.xml') {
                    $reader = [IO.StreamReader]::new($input, [Text.UTF8Encoding]::new($false), $true)
                    try { $content = $reader.ReadToEnd() } finally { $reader.Dispose() }
                    $xml = [Xml.XmlDocument]::new()
                    $xml.PreserveWhitespace = $true
                    $xml.LoadXml($content)
                    $namespaceManager = [Xml.XmlNamespaceManager]::new($xml.NameTable)
                    $namespaceManager.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
                    $paragraphs = @($xml.SelectNodes('//w:p', $namespaceManager) | Where-Object { $_.InnerText.Trim() -eq '{{EMPFAENGER_ANREDE}}' })
                    if ($paragraphs.Count -ne 1) { throw 'Die freigegebene Anredezeile wurde nicht exakt einmal gefunden.' }
                    [void]$paragraphs[0].ParentNode.RemoveChild($paragraphs[0])
                    $settings = [Xml.XmlWriterSettings]::new()
                    $settings.Encoding = [Text.UTF8Encoding]::new($false)
                    $settings.OmitXmlDeclaration = $false
                    $writer = [Xml.XmlWriter]::Create($output, $settings)
                    try { $xml.Save($writer) } finally { $writer.Dispose() }
                }
                else { $input.CopyTo($output) }
            }
            finally { $output.Dispose(); $input.Dispose() }
        }
    }
    finally { $destinationArchive.Dispose() }
}
finally { $destinationStream.Dispose(); $sourceArchive.Dispose() }

