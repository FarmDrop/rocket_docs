module RocketDocs
  module Parser
    class DocNode < String
      def initialize
        @stop_indentation = false
        super
      end

      # Set this to true in a handler to ignore all indentation in the child
      # text. Good for markdown formatting etc.
      def stop_indentation!
        @stop_indentation = true
      end

      def stop_indentation?
        @stop_indentation
      end
    end

    class << self
      def comments_for_method(method_name, file_path)
        method_comments(file_path)[method_name.to_s]
      end

      def method_comments(file_path)
        comments = {}
        temp_comment = []
        File.read(file_path).each_line do |line|
          if extract_method_comment(line, comments, temp_comment)
            temp_comment = []
          end
        end
        clean_comments(comments)
      end

      def parse_comments(comments)
        indentation_parser.read(comments, {})
      end

      def keywords
        http_keywords + parser_keywords
      end

      def http_keywords
        %w(GET POST PUT PATCH DELETE)
      end

      def parser_keywords
        string_keywords + hash_keywords
      end

      private

      def string_keywords
        %w(DOC URL)
      end

      def hash_keywords
        %w(PARAMS)
      end

      def indentation_parser
        IndentationParser.new do |p|
          indentation_parser_default(p)
          indentation_parser_leafs(p)
        end
      end

      def indentation_parser_default(p)
        p.default do |parent, source|
          parent ||= {}
          words = source.split
          keyword, key = words.first.try(:upcase), words.first
          if words.count == 1
            if keyword == 'DOC'
              parent[keyword] = DocNode.new.tap(&:stop_indentation!)
            elsif keywords.include?(keyword)
              parent[keyword] = string_keywords.include?(keyword) ? '' : {}
            elsif words.count == 1 && parent.is_a?(Hash)
              parent[key] = {}
            end
          end
        end
      end

      def indentation_parser_leafs(p)
        p.on_leaf do |parent, source|
          val = source
          val.strip! unless parent.try(:stop_indentation?)
          case parent
          when String
            parent << "\n" if parent.length != 0
            parent << val
          when Hash
            k, val = source.split(':', 2)
            val = val ? val.try(:strip) : {}
            parent[k] = val
          end
          val
        end
      end

      def extract_method_comment(line, comments = {}, temp_comment = [])
        return true unless valid_line?(line)
        if line =~ /^\s*def\s+\w+$/
          comments[method_name(line)] = temp_comment.join
          true
        else
          temp_comment << line
          false
        end
      end

      def valid_line?(line)
        line =~ /^\s*#.*$/ || line =~ /^\s*def\s+\w+$/ || line =~ /^\s+$/
      end

      def method_name(line)
        line.match(/^\s*def\s+\w+$/).to_s.split(' ').last
      end

      def clean_comments(comments)
        comments.each do |k, v|
          comments[k] = v.gsub(/(?<=\n|\A)\n? *# ?/, '') # Remove leading comment character
                          .gsub(/\n+(?=\Z)/, "\n") # Remove trailing newlines
                          .gsub(/(?<=\A)\n+/, '') # Remove leading newlines
        end
        comments
      end
    end
  end
end
