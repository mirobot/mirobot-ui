require 'zlib'
require 'nokogiri'
require 'uglifier'
require 'cssminify'
require 'bindata'

task :default => [:flatten]

$ugly_options = {
  :comments => :none
}

$input_dir = 'src'
$output_dir = 'out'
$dist_dir = 'dist'
$ts = Time.now.strftime('%Y%m%d%H%M')

def squish_file(input, options = {})
  # Don't squish site survey because this removes the tag we want
  return input if input =~ /CONFIG_VAR\(survey_cmd, CFG_SURVEY\)/
  doc = Nokogiri::HTML(input)
  # Compress all of the inline scripts
  doc.xpath('//script').each do |s|
    unless (s.content.include?('/*<%') && s.content.include?('%>*/'))
      src = (options[:flatten] && s['src'] ? File.read("src/#{s['src']}") : s.content)
      s.content = Uglifier.new($ugly_options).compile(src)
      s.delete('src') if options[:flatten]
    end
  end
  # Remove whitespace from the html
  doc.xpath('//text()').each do |node|
    node.remove unless node.content=~/\S/
  end
  # Minify the CSS
  doc.xpath('//style').each do |c|
    c.content = CSSminify.compress(c.content)
  end
  doc.to_s
end

task :clean_output do
  if Dir.exists? $output_dir
    Dir.glob("#{$output_dir}/*").each do |f|
      File.delete(f)
    end
  else
    Dir.mkdir($output_dir)
  end
end

task :flatten do
  puts "Building single mirobot html file"
  puts "Timestamp: #{$ts}"
  Rake::Task["clean_output"].execute
  # Combine all of the html and javascript into one file
  # Find all of the html files to compress
  Dir.glob('src/*.html').each do |f|
    # Read the file
    file = File.read(f)
    # Add the timestamp for versioning
    file = add_timestamp(file)
    # Deside where to put it
    outfile = f.gsub($input_dir, $output_dir)
    # Flatten and compress it
    output = squish_file(file, :flatten => true)
    # Write to file
    File.open(outfile, 'w') { |file|
      file.write(output)
    }
  end
end

task :dist do
  Rake::Task["flatten"].execute
  Rake::Task["create_bin"].execute
end

def add_timestamp(input)
  return input.gsub('{{timestamp}}', $ts)
end

task :build do
  puts "Building mirobot UI files"
  Rake::Task["clean_output"].execute
  Dir.glob('src/*').each do |f|
    # Read the file
    file = File.read(f)
    # Add the timestamp for versioning
    file = add_timestamp(file)
    # Deside where to put it
    outfile = f.gsub($input_dir, $output_dir)
    # Flatten and compress it
    if f =~ /.*\.html\z/
      output = squish_file(file)
    elsif f =~ /.*\.js\z/
      output = Uglifier.new($ugly_options).compile(file)
    elsif f =~ /.*\.css\z/
      output = CSSminify.compress(file)
    end
    # Write to file
    File.open(outfile, 'w') { |file|
      file.write(output)
    }
  end
end

class FileHeader < BinData::Record
  int32le :next_file
  string  :file_name, :length => 32, :pad_byte => 0
  int32le :file_loc
  int32le :file_len
  int32le :dyn_addr, :initial_value => 0
  int32le :dyn_length, :initial_value => 0
  int8le  :file_type
  array   :reserved, :initial_length => 3 do
    int8le :initial_value => 0
  end
end

def file_type(name)
  types = {'HTML' => 1, 'CSS' => 2, 'JS' => 3, 'JPG' => 4, 'PNG' => 5, 'GIF' => 6}
  types[File.extname(name).gsub('.', '').upcase]
end

task :create_bin do
  puts "Generating bin file"
  outfile = "#{$dist_dir}/mirobot.bin"
  headers = []
  file_contents = []
  files = Dir.glob("#{$output_dir}/*").sort_by {|f| File.basename f}
  files.each_with_index do |f, i|
    type = file_type(f)
    if type
      file_contents << File.read(f).force_encoding('ASCII-8BIT')
      headers << FileHeader.new(:next_file => (i+1) * 56, :file_name => f.gsub($output_dir, ''), :file_len => file_contents.last.length, :file_type => type)
      headers.last.file_loc = (56 * files.length) + file_contents.join.length - file_contents.last.length
      if pos = file_contents.last =~ /(\/\*<%(.*)%>\*\/)/m
        headers.last.dyn_addr = pos
        headers.last.dyn_length = $2.length + 8
      end
    end
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
  Dir.mkdir($dist_dir) unless Dir.exists?($dist_dir)
  File.delete(outfile) if File.exists?(outfile)
  File.open(outfile, 'w') { |file|
    file.write(output)
  }
end
