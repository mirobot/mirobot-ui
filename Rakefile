require 'zlib'
require 'nokogiri'
require 'uglifier'
require 'cssminify'
require 'bindata'

task :default => [:build]

ugly_options = {
  :comments => :none
}

$output_dir = 'out'
$dist_dir = 'dist'

task :build do
  puts "Building mirobot html file"
  if Dir.exists? $output_dir
    Dir.glob("#{$output_dir}/*").each do |f|
      File.delete(f)
    end
  else
    Dir.mkdir($output_dir)
  end
  # Combine all of the html and javascript into one file
  # Find all of the html files to compress
  Dir.glob('src/*.html').each do |f|
    outfile = f.gsub('src', $output_dir)
    # Read the file
    file = File.read(f)
    # Parse it
    doc = Nokogiri::HTML(file)
    # Extract all of the scripts in order
    js = ['']
    doc.xpath('//script').each do |s|
      js << (s['src'] ? File.read("src/#{s['src']}") : s.content)
      s.remove
    end
    # Re-inser the scripts at the end of the document
    new_script = Nokogiri::XML::Node.new("script", doc)
    new_script.content = Uglifier.new(ugly_options).compile(js.join("\n"))
    doc.css('body').first.children.last.add_next_sibling(new_script)
    # Remove whitespace from the html
    doc.xpath('//text()').each do |node|
      node.remove unless node.content=~/\S/
    end
    # Minify the CSS
    css = ['']
    doc.xpath('//style').each do |c|
      css << c.content
      c.remove
    end
    if css.length > 1
      new_style = Nokogiri::XML::Node.new("style", doc)
      new_style.content = CSSminify.compress(css.join("\n"))
      doc.xpath('//head').first.children.last.add_next_sibling(new_style)
    end
    # Write to file
    File.open(outfile, 'w') { |file|
      file.write(doc)
    }
  end
end

class FileHeader < BinData::Record
  int32le :next_file
  string  :file_name, :length => 32, :pad_byte => 0
  int32le :file_loc
  int32le :file_len
  int32le :padding1, :value => 0
  int32le :padding2, :value => 0
  int32le :padding3, :value => 1
end

task :dist => :build do
  puts "Generating bin file"
  outfile = "#{$dist_dir}/lpb_web.bin"
  headers = []
  file_contents = []
  files = Dir.glob("#{$output_dir}/*")
  files.each_with_index do |f, i|
    file_contents << File.read(f).force_encoding('ASCII-8BIT')
    headers << FileHeader.new(:next_file => (i+1) * 56, :file_name => f.gsub($output_dir, ''), :file_len => file_contents.last.length)
    headers.last.file_loc = (56 * files.length) + file_contents.join.length - file_contents.last.length
  end
  headers.last.next_file = 0
  output = headers.map(&:to_binary_s).join + file_contents.join
  output.force_encoding('ASCII-8BIT')
  crc = output.scan(/.{1,4}/m).map{|x|
    x.length < 4 ? (x + "\0" * (4 - x.length)).unpack('L').first : x.unpack('L').first
  }.inject(0){ |sum, n|
    (sum + n) & 0xFFFFFFFF
  }
  output += "\xAA\x88".force_encoding('ASCII-8BIT')
  output += [crc].pack('V')
  output += "\xAA\x88".force_encoding('ASCII-8BIT')
  printf("CRC:%x\r\n", crc)
  Dir.mkdir($dist_dir) unless Dir.exists?($dist_dir)
  File.delete(outfile) if File.exists?(outfile)
  File.open(outfile, 'w') { |file|
    file.write(output)
  }
  
end
