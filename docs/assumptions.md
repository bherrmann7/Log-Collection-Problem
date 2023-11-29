# Assumptions

- I'm presuming ascii for the log files (when detecting new lines),
  although it would be better to move backwards through the buffer
  using the unicode high order bit for detecting character
  boundaries. Most of the /var/log/\_.log files on my machine do not
  contain UTF-8. I'm aware of Unicode's graphemes. See
  https://tonsky.me/blog/unicode/   Handling Unicode would need to
  take graphemes into account.

- A maximum line length was not specified, using files with very long
  lines (greater than 16383) would likely result in unexpected
  behavior. I expect the remaining buffer (ReverseLinesExtractor)
  would grow without bounds.

- The very first chunk reading from the log file could contain a
  partial line, this will be discarded as an incomplete line

- This solution has no authentication and/or authorization

- This solution does not encrypt traffic over the wire

- The running user is presumed to have read access to files in
  /var/log (aka part of the "adm" group, or files in /var/log are
  world read)

- node and tests are running on some unix variant (ie. the Windows subsystem
  for linux, or linux or Mac.), ie has a /tmp/ directory
  
- The tests assume that the command line programs "diff" and "tac" are
  installed and in the PATH
